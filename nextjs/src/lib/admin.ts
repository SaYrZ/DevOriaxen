import { cookies } from "next/headers";

const ADMIN_COOKIE_NAME = "admin_session";

// Get client IP from request headers
export function getClientIp(headers: Headers): string {
  const forwarded = headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  const realIp = headers.get("x-real-ip");
  if (realIp) {
    return realIp;
  }
  return "127.0.0.1";
}

// Check if IP is allowed
export function isIpAllowed(clientIp: string): boolean {
  const allowedIps = process.env.ALLOWED_IPS?.split(",").map(ip => ip.trim()) || [];
  
  // Check exact match
  if (allowedIps.includes(clientIp)) {
    return true;
  }
  
  // Check CIDR notation (e.g., 192.168.1.0/24)
  for (const allowed of allowedIps) {
    if (allowed.includes("/")) {
      if (cidrMatch(clientIp, allowed)) {
        return true;
      }
    }
  }
  
  return false;
}

// Simple CIDR matching
function cidrMatch(ip: string, cidr: string): boolean {
  const [network, bits] = cidr.split("/");
  const mask = ~(2 ** (32 - parseInt(bits)) - 1);
  
  const ipNum = ipToNumber(ip);
  const networkNum = ipToNumber(network);
  
  return (ipNum & mask) === (networkNum & mask);
}

function ipToNumber(ip: string): number {
  return ip.split(".").reduce((acc, octet) => (acc << 8) + parseInt(octet), 0) >>> 0;
}

// Verify admin credentials
export function verifyAdminCredentials(username: string, password: string): boolean {
  const adminUsername = process.env.ADMIN_USERNAME;
  const adminPassword = process.env.ADMIN_PASSWORD;
  
  // Use constant-time comparison to prevent timing attacks
  if (!adminUsername || !adminPassword) {
    return false;
  }
  
  return (
    timingSafeEqual(username, adminUsername) &&
    timingSafeEqual(password, adminPassword)
  );
}

// Timing-safe string comparison
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) {
    return false;
  }
  
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

// Set admin session cookie
export async function setAdminSession(): Promise<void> {
  const cookieStore = await cookies();
  const secret = process.env.ADMIN_SECRET || "default_secret";
  
  cookieStore.set(ADMIN_COOKIE_NAME, secret, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 60 * 60 * 24, // 24 hours
    path: "/",
  });
}

// Verify admin session
export async function verifyAdminSession(): Promise<boolean> {
  const cookieStore = await cookies();
  const session = cookieStore.get(ADMIN_COOKIE_NAME);
  const secret = process.env.ADMIN_SECRET || "default_secret";
  
  return session?.value === secret;
}

// Clear admin session
export async function clearAdminSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(ADMIN_COOKIE_NAME);
}

// Sanitize input to prevent XSS
export function sanitizeInput(input: string): string {
  return input
    .replace(/&/g, String.fromCharCode(38) + "amp;")
    .replace(/</g, String.fromCharCode(60) + "gt;")
    .replace(/>/g, String.fromCharCode(62) + "gt;")
    .replace(/"/g, String.fromCharCode(34) + "quot;")
    .replace(/'/g, String.fromCharCode(39) + "#x27;")
    .trim();
}

// Validate email format
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
