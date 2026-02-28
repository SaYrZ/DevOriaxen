import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isIpAllowed, getClientIp } from "@/lib/admin";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only protect admin routes
  if (!pathname.startsWith("/admin")) {
    return NextResponse.next();
  }

  const clientIp = getClientIp(request.headers);

  // Check if IP is allowed
  if (!isIpAllowed(clientIp)) {
    return NextResponse.json(
      { error: "Access denied. Your IP is not whitelisted." },
      { status: 403 }
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: "/admin/:path*",
};
