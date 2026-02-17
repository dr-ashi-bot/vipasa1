import { NextResponse } from "next/server";
import { startSession } from "@/lib/engine";

export async function POST(request: Request): Promise<Response> {
  try {
    const payload = (await request.json()) as {
      user_id?: string;
      preferred_visual_theme?: "puppy-walk" | "gymnast-routine";
    };
    const response = startSession({
      user_id: payload.user_id,
      preferred_visual_theme: payload.preferred_visual_theme,
    });
    return NextResponse.json(response);
  } catch (error) {
    return NextResponse.json(
      { message: (error as Error).message || "Unable to start session." },
      { status: 400 },
    );
  }
}
