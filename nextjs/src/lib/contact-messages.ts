import fs from "fs";
import path from "path";

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  discord?: string;
  message: string;
  createdAt: string;
  read: boolean;
}

const MESSAGES_FILE = path.join(process.cwd(), "data", "contact-messages.json");

function ensureMessagesFile() {
  const dir = path.dirname(MESSAGES_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(MESSAGES_FILE)) {
    fs.writeFileSync(MESSAGES_FILE, JSON.stringify([], null, 2));
  }
}

export function getContactMessages(): ContactMessage[] {
  ensureMessagesFile();
  try {
    const data = fs.readFileSync(MESSAGES_FILE, "utf-8");
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export function saveContactMessage(message: Omit<ContactMessage, "id" | "createdAt" | "read">): ContactMessage {
  const messages = getContactMessages();
  const newMessage: ContactMessage = {
    ...message,
    id: generateId(),
    createdAt: new Date().toISOString(),
    read: false,
  };
  messages.unshift(newMessage); // Add to beginning
  fs.writeFileSync(MESSAGES_FILE, JSON.stringify(messages, null, 2));
  return newMessage;
}

export function markMessageAsRead(id: string): boolean {
  const messages = getContactMessages();
  const message = messages.find(m => m.id === id);
  if (message) {
    message.read = true;
    fs.writeFileSync(MESSAGES_FILE, JSON.stringify(messages, null, 2));
    return true;
  }
  return false;
}

export function deleteMessage(id: string): boolean {
  const messages = getContactMessages();
  const index = messages.findIndex(m => m.id === id);
  if (index !== -1) {
    messages.splice(index, 1);
    fs.writeFileSync(MESSAGES_FILE, JSON.stringify(messages, null, 2));
    return true;
  }
  return false;
}

function generateId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}
