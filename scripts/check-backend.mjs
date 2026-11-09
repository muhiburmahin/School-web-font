const originHeader = "http://localhost:3001";

if (process.env.NODE_ENV === "production") {
  console.error("check-backend is for development only.");
  process.exit(1);
}

const base = resolveBase();
const paths = ["/api/v1/health", "/api/v1/institution-profile"];

let failed = false;
for (const path of paths) {
  const url = new URL(path, `${base}/`);
  try {
    const response = await fetch(url, {
      headers: { Accept: "application/json", Origin: originHeader },
      redirect: "manual",
    });
    console.log(`${path} status=${response.status}`);
    console.log(`  access-control-allow-origin=${response.headers.get("access-control-allow-origin") ?? "none"}`);
    console.log(`  access-control-allow-credentials=${response.headers.get("access-control-allow-credentials") ?? "none"}`);
    const cookies = typeof response.headers.getSetCookie === "function" ? response.headers.getSetCookie() : [];
    if (cookies.length === 0) {
      console.log("  set-cookie=none");
    } else {
      for (const cookie of cookies) console.log(`  set-cookie ${describeCookie(cookie)}`);
    }
  } catch {
    failed = true;
    console.log(`${path} status=unreachable`);
  }
}

if (failed) process.exit(1);

function resolveBase() {
  const configured = process.env.BACKEND_ORIGIN || process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000";
  if (configured.startsWith("/")) {
    if (!process.env.BACKEND_ORIGIN) {
      console.error("BACKEND_ORIGIN is required when NEXT_PUBLIC_API_BASE_URL is a path.");
      process.exit(1);
    }
    return process.env.BACKEND_ORIGIN.replace(/\/$/, "");
  }
  return configured.replace(/\/$/, "");
}

function describeCookie(header) {
  const parts = header.split(";").map((part) => part.trim());
  const name = parts[0]?.split("=")[0] || "unknown";
  const flags = parts.slice(1).filter((part) => part.length > 0);
  return `${name}: ${flags.length > 0 ? flags.join("; ") : "no flags"}`;
}
