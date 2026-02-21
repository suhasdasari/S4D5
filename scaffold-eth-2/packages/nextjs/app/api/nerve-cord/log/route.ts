import { NextResponse } from "next/server";

const NERVE_SERVER = process.env.NERVE_SERVER || "https://s4d5-production.up.railway.app";
const NERVE_TOKEN = process.env.NERVE_TOKEN || "s4d5-suhas-susmitha-karthik";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = searchParams.get("limit") || "50";

    const response = await fetch(`${NERVE_SERVER}/log?limit=${limit}`, {
      headers: {
        Authorization: `Bearer ${NERVE_TOKEN}`,
      },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Nerve-Cord API error: ${response.status}`);
    }

    const logs = await response.json();
    return NextResponse.json(logs);
  } catch (error) {
    console.error("Failed to fetch Nerve-Cord logs:", error);
    return NextResponse.json({ error: "Failed to fetch logs" }, { status: 500 });
  }
}
