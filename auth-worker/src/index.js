const encoder = new TextEncoder();
const sessionLifetimeSeconds = 60 * 60 * 8;

function base64UrlEncode(value) {
  const bytes = typeof value === "string" ? encoder.encode(value) : value;
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

function base64UrlDecode(value) {
  const padded = value.replaceAll("-", "+").replaceAll("_", "/") + "=".repeat((4 - (value.length % 4)) % 4);
  return atob(padded);
}

async function sign(value, secret) {
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return base64UrlEncode(new Uint8Array(await crypto.subtle.sign("HMAC", key, encoder.encode(value))));
}

async function createSession(secret) {
  const payload = base64UrlEncode(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + sessionLifetimeSeconds }));
  return `${payload}.${await sign(payload, secret)}`;
}

async function validSession(token, secret) {
  if (!token?.includes(".")) return false;
  const [payload, signature] = token.split(".");
  if (signature !== await sign(payload, secret)) return false;
  try {
    return JSON.parse(base64UrlDecode(payload)).exp > Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
}

function cookieValue(request, name) {
  const cookie = request.headers.get("Cookie") || "";
  return cookie.split(";").map((entry) => entry.trim()).find((entry) => entry.startsWith(`${name}=`))?.slice(name.length + 1);
}

function corsHeaders(request, env) {
  const origin = request.headers.get("Origin");
  return origin === env.ALLOWED_ORIGIN
    ? { "Access-Control-Allow-Origin": origin, "Access-Control-Allow-Credentials": "true", "Access-Control-Allow-Headers": "Content-Type", "Access-Control-Allow-Methods": "POST, GET, OPTIONS", Vary: "Origin" }
    : {};
}

function json(request, env, body, status = 200, headers = {}) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff", "Referrer-Policy": "no-referrer", ...corsHeaders(request, env), ...headers } });
}

function sessionCookie(value, maxAge = sessionLifetimeSeconds) {
  return `personal_homepage_admin=${value}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${maxAge}`;
}

function isAllowedOrigin(request, env) {
  return request.headers.get("Origin") === env.ALLOWED_ORIGIN;
}

function cleanText(value, maxLength) {
  return typeof value === "string" ? value.trim().slice(0, maxLength) : "";
}

async function isRateLimited(env, key, limit, windowMilliseconds) {
  const now = Date.now();
  const existing = await env.MESSAGES.prepare("SELECT window_started_at, request_count FROM request_limits WHERE key = ?").bind(key).first();
  if (!existing || existing.window_started_at <= now - windowMilliseconds) {
    await env.MESSAGES.prepare("INSERT INTO request_limits (key, window_started_at, request_count) VALUES (?, ?, 1) ON CONFLICT(key) DO UPDATE SET window_started_at = excluded.window_started_at, request_count = excluded.request_count").bind(key, now).run();
    return false;
  }
  if (existing.request_count >= limit) return true;
  await env.MESSAGES.prepare("UPDATE request_limits SET request_count = request_count + 1 WHERE key = ?").bind(key).run();
  return false;
}

async function sendAdminNotification(env, entry) {
  if (!env.RESEND_API_KEY || !env.ADMIN_EMAIL || !env.MESSAGE_FROM_EMAIL) return;
  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: env.MESSAGE_FROM_EMAIL,
      to: [env.ADMIN_EMAIL],
      subject: `[개인홈페이지] ${entry.isPrivate ? "비공개 " : ""}글 남기기: ${entry.name}`,
      text: `닉네임: ${entry.name}\n이메일: ${entry.email}\n공개 여부: ${entry.isPrivate ? "비공개" : "공개"}\n\n${entry.message}`,
    }),
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders(request, env) });
    if (!isAllowedOrigin(request, env)) return json(request, env, { error: "origin_not_allowed" }, 403);

    if (url.pathname === "/api/auth/login" && request.method === "POST") {
      let credentials;
      try { credentials = await request.json(); } catch { return json(request, env, { error: "invalid_request" }, 400); }
      const clientIp = request.headers.get("CF-Connecting-IP") || "unknown";
      if (await isRateLimited(env, `login:${clientIp}`, 5, 15 * 60 * 1000)) return json(request, env, { error: "too_many_requests" }, 429);
      if (credentials.username !== env.ADMIN_USERNAME || credentials.password !== env.ADMIN_PASSWORD) return json(request, env, { error: "invalid_credentials" }, 401);
      const token = await createSession(env.SESSION_SECRET);
      return json(request, env, { authenticated: true }, 200, { "Set-Cookie": sessionCookie(token) });
    }

    if (url.pathname === "/api/auth/session" && request.method === "GET") {
      const authenticated = await validSession(cookieValue(request, "personal_homepage_admin"), env.SESSION_SECRET);
      return json(request, env, { authenticated }, authenticated ? 200 : 401);
    }

    if (url.pathname === "/api/guestbook" && request.method === "GET") {
      const { results } = await env.MESSAGES.prepare("SELECT id, name, message, created_at FROM guestbook_messages WHERE is_private = 0 ORDER BY created_at DESC LIMIT 100").all();
      return json(request, env, { messages: results.map((entry) => ({ id: entry.id, name: entry.name, message: entry.message, createdAt: entry.created_at })) });
    }

    if (url.pathname === "/api/guestbook" && request.method === "POST") {
      let body;
      try { body = await request.json(); } catch { return json(request, env, { error: "invalid_request" }, 400); }
      const entry = { name: cleanText(body.name, 40), email: cleanText(body.email, 254), message: cleanText(body.message, 1000), isPrivate: body.isPrivate === true };
      if (!entry.name || !entry.email.includes("@") || !entry.message) return json(request, env, { error: "invalid_entry" }, 400);
      const clientIp = request.headers.get("CF-Connecting-IP") || "unknown";
      if (await isRateLimited(env, `guestbook:${clientIp}`, 3, 60 * 60 * 1000)) return json(request, env, { error: "too_many_requests" }, 429);
      const id = crypto.randomUUID();
      const createdAt = new Date().toISOString();
      await env.MESSAGES.prepare("INSERT INTO guestbook_messages (id, name, email, message, is_private, created_at) VALUES (?, ?, ?, ?, ?, ?)").bind(id, entry.name, entry.email, entry.message, entry.isPrivate ? 1 : 0, createdAt).run();
      try { await sendAdminNotification(env, entry); } catch {}
      return json(request, env, { submitted: true }, 201);
    }

    if (url.pathname === "/api/admin/guestbook" && request.method === "GET") {
      const authenticated = await validSession(cookieValue(request, "personal_homepage_admin"), env.SESSION_SECRET);
      if (!authenticated) return json(request, env, { error: "unauthorized" }, 401);
      const { results } = await env.MESSAGES.prepare("SELECT id, name, email, message, is_private, created_at FROM guestbook_messages ORDER BY created_at DESC LIMIT 250").all();
      return json(request, env, { messages: results });
    }

    if (url.pathname === "/api/auth/logout" && request.method === "POST") return json(request, env, { authenticated: false }, 200, { "Set-Cookie": sessionCookie("", 0) });
    return json(request, env, { error: "not_found" }, 404);
  },
};
