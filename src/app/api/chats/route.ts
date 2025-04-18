import dbConnect from "@/app/api/lib/dbConnect";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const db = await dbConnect();
    const chats = await db.collection("chats").find({}).toArray();
    return NextResponse.json(chats);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch chat history" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { agentId, userAddress, messages } = await req.json();

    const db = await dbConnect();
    const result = await db.collection("chats").insertOne({
      agentId,
      userAddress,
      messages,
      createdAt: new Date(),
    });

    return NextResponse.json({ success: true, chatId: result.insertedId }, { status: 201 });
  } catch (error) {
    console.error("Error saving chat:", error);
    return NextResponse.json({ error: "Failed to save chat" }, { status: 500 });
  }
}
