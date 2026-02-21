import { NextResponse } from "next/server";

const NERVE_SERVER = process.env.NERVE_SERVER || "https://s4d5-production.up.railway.app";
const NERVE_TOKEN = process.env.NERVE_TOKEN || "s4d5-suhas-susmitha-karthik";

export async function GET() {
  try {
    const response = await fetch(`${NERVE_SERVER}/messages`, {
      headers: {
        Authorization: `Bearer ${NERVE_TOKEN}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Nerve-Cord API error: ${response.status}`);
    }

    const messages = await response.json();
    return NextResponse.json(messages);
  } catch (error) {
    console.error("Failed to fetch Nerve-Cord messages:", error);
    return NextResponse.json({ error: "Failed to fetch messages" }, { status: 500 });
  }
}
