import { NextResponse } from "next/server";
import { verifyVideo } from "@/lib/engine";

export async function POST(request: Request): Promise<Response> {
  try {
    const payload = (await request.json()) as {
      user_id: string;
      video_id: string;
      watch_duration_sec: number;
      video_duration_sec: number;
      playback_rate_avg: number;
      seek_events: number;
    };
    if (!payload.user_id || !payload.video_id) {
      return NextResponse.json({ message: "user_id and video_id are required." }, { status: 400 });
    }

    const response = verifyVideo(payload);
    return NextResponse.json(response);
  } catch (error) {
    return NextResponse.json(
      { message: (error as Error).message || "Unable to verify video progress." },
      { status: 400 },
    );
  }
}
