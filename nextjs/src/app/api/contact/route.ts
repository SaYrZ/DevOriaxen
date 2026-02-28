import { NextRequest, NextResponse } from "next/server";
import { saveContactMessage } from "@/lib/contact-messages";
import { sanitizeInput, isValidEmail } from "@/lib/admin";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Sanitize inputs to prevent XSS
    const name = sanitizeInput(body.name || "");
    const email = sanitizeInput(body.email || "");
    const discord = body.discord ? sanitizeInput(body.discord) : undefined;
    const message = sanitizeInput(body.message || "");

    // Validate required fields
    if (!name || !email || !message) {
      return NextResponse.json(
        { error: "Name, email, and message are required" },
        { status: 400 }
      );
    }

    // Validate email format
    if (!isValidEmail(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      );
    }

    // Validate name length
    if (name.length > 100) {
      return NextResponse.json(
        { error: "Name is too long" },
        { status: 400 }
      );
    }

    // Validate message length
    if (message.length > 5000) {
      return NextResponse.json(
        { error: "Message is too long" },
        { status: 400 }
      );
    }

    // Validate discord if provided
    if (discord && discord.length > 100) {
      return NextResponse.json(
        { error: "Discord handle is too long" },
        { status: 400 }
      );
    }

    // Save the message
    const savedMessage = saveContactMessage({
      name,
      email,
      discord,
      message,
    });

    return NextResponse.json({ success: true, id: savedMessage.id });
  } catch (error) {
    console.error("Contact form error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
