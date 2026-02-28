import { NextRequest, NextResponse } from "next/server";
import { verifyAdminSession } from "@/lib/admin";
import { getContactMessages, markMessageAsRead, deleteMessage } from "@/lib/contact-messages";

export async function GET(request: NextRequest) {
  try {
    // Verify admin session
    const isAuthenticated = await verifyAdminSession();
    if (!isAuthenticated) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const messages = getContactMessages();
    return NextResponse.json({ messages });
  } catch (error) {
    console.error("Admin messages error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    // Verify admin session
    const isAuthenticated = await verifyAdminSession();
    if (!isAuthenticated) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { id, action } = body;

    if (!id || !action) {
      return NextResponse.json(
        { error: "ID and action are required" },
        { status: 400 }
      );
    }

    if (action === "read") {
      const success = markMessageAsRead(id);
      return NextResponse.json({ success });
    }

    if (action === "delete") {
      const success = deleteMessage(id);
      return NextResponse.json({ success });
    }

    return NextResponse.json(
      { error: "Invalid action" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Admin messages PATCH error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
