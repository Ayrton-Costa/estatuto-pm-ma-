// supabase/functions/send-push/index.ts
// Edge Function Deno — envia Web Push para usuários com alertas configurados
// Chamada pelo GitHub Action diariamente, hora a hora

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Funções auxiliares de VAPID / Web Push em Deno puro
// (sem dependências externas pesadas)

const VAPID_PUBLIC_KEY  = Deno.env.get("VAPID_PUBLIC_KEY")  ?? "";
const VAPID_PRIVATE_KEY = Deno.env.get("VAPID_PRIVATE_KEY") ?? "";
const VAPID_SUBJECT     = Deno.env.get("VAPID_SUBJECT")     ?? "mailto:ayrton@ayrtonquestoes.com";

// ── Helpers base64url
function b64url(buf: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buf)))
    .replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function fromB64url(s: string): Uint8Array {
  return Uint8Array.from(atob(s.replace(/-/g,"+").replace(/_","/")), c => c.charCodeAt(0));
}

// ── Gera JWT VAPID
async function makeVapidJWT(audience: string): Promise<string> {
  const header  = b64url(new TextEncoder().encode(JSON.stringify({typ:"JWT",alg:"ES256"})));
  const payload = b64url(new TextEncoder().encode(JSON.stringify({
    aud: audience,
    exp: Math.floor(Date.now()/1000) + 12*3600,
    sub: VAPID_SUBJECT
  })));
  const signing = `${header}.${payload}`;

  // Importa chave privada VAPID (PEM → raw)
  // A chave privada está em base64url de PEM — decodifica
  let pem = atob(VAPID_PRIVATE_KEY.replace(/-/g,"+").replace(/_/g,"/"));
  // Extrai bytes DER do PEM (entre BEGIN e END)
  const pemLines = pem.split("\n").filter(l => !l.startsWith("-----") && l.trim());
  const der = Uint8Array.from(atob(pemLines.join("")), c => c.charCodeAt(0));

  const key = await crypto.subtle.importKey(
    "pkcs8", der,
    { name:"ECDSA", namedCurve:"P-256" },
    false, ["sign"]
  );

  const sig = await crypto.subtle.sign(
    { name:"ECDSA", hash:"SHA-256" },
    key,
    new TextEncoder().encode(signing)
  );

  return `${signing}.${b64url(sig)}`;
}

// ── Envia uma notificação Web Push para uma subscription
async function sendPush(sub: {endpoint:string, p256dh:string, auth:string}, payload: string) {
  const url    = new URL(sub.endpoint);
  const origin = `${url.protocol}//${url.host}`;
  const jwt    = await makeVapidJWT(origin);

  const res = await fetch(sub.endpoint, {
    method: "POST",
    headers: {
      "Authorization": `vapid t=${jwt},k=${VAPID_PUBLIC_KEY}`,
      "Content-Type":  "application/octet-stream",
      "Content-Encoding": "aes128gcm",
      "TTL": "86400",
    },
    body: new TextEncoder().encode(payload),
  });
  return res.status;
}

// ── Handler principal
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers:{ "Access-Control-Allow-Origin":"*" } });
  }

  try {
    // Hora e dia atual UTC-3 (Brasília)
    const agora = new Date(Date.now() - 3*3600*1000);
    const horaAtual = `${String(agora.getUTCHours()).padStart(2,"0")}:${String(agora.getUTCMinutes()).padStart(2,"0")}`;
    const diasSemana = ["dom","seg","ter","qua","qui","sex","sab"];
    const diaAtual   = diasSemana[agora.getUTCDay()];

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SERVICE_ROLE_KEY") ?? ""
    );

    // Busca todas as subscriptions ativas
    const { data: subs, error } = await supabase
      .from("push_subscriptions")
      .select("*")
      .eq("ativo", true);

    if (error) throw error;

    let enviados = 0, erros = 0;

    for (const sub of subs ?? []) {
      const horarios: {hora:string, dias:string[]}[] = sub.horarios ?? [];

      // Verifica se algum horário bate com a hora atual (±1 min)
      const deveEnviar = horarios.some(h => {
        if (!h.dias.includes(diaAtual)) return false;
        const [hh, mm] = h.hora.split(":").map(Number);
        const minAlvo  = hh * 60 + mm;
        const minAgora = agora.getUTCHours() * 60 + agora.getUTCMinutes();
        return Math.abs(minAgora - minAlvo) <= 1;
      });

      if (!deveEnviar) continue;

      const msg = JSON.stringify({
        title: "📘 Hora de estudar! — Ayrton Questões",
        body:  `Seu horário de estudo chegou (${horaAtual}). Bora resolver questões da PM-MA! 🎯`,
      });

      try {
        const status = await sendPush(sub, msg);
        if (status === 410 || status === 404) {
          // Subscription expirada — desativa
          await supabase.from("push_subscriptions").update({ativo:false}).eq("id", sub.id);
        }
        if (status < 300) enviados++;
        else erros++;
      } catch (_) { erros++; }
    }

    return new Response(
      JSON.stringify({ ok:true, hora:horaAtual, dia:diaAtual, enviados, erros }),
      { headers:{ "Content-Type":"application/json", "Access-Control-Allow-Origin":"*" } }
    );

  } catch (e) {
    return new Response(
      JSON.stringify({ ok:false, error: String(e) }),
      { status:500, headers:{ "Content-Type":"application/json" } }
    );
  }
});
