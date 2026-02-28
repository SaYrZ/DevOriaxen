import { NextRequest, NextResponse } from "next/server";
import { verifyAdminCredentials, setAdminSession, sanitizeInput } from "@/lib/admin";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Sanitize inputs to prevent XSS
    const username = sanitizeInput(body.username || "");
    const password = body.password || "";

    // Validate inputs
    if (!username || !password) {
      return NextResponse.json(
        { error: "Username and password are required" },
        { status: 400 }
      );
    }

    // Verify credentials
    const isValid = verifyAdminCredentials(username, password);
    
    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Set session cookie
    await setAdminSession();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
