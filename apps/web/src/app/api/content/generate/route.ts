import { NextResponse } from "next/server";
import { generateContent } from "@/lib/engine";
import type { SubjectTrack } from "@/lib/types";

export async function POST(request: Request): Promise<Response> {
  try {
    const payload = (await request.json()) as {
      user_id: string;
      concept_id: string;
      track: SubjectTrack;
      session_id: string;
    };
    if (!payload.user_id || !payload.concept_id || !payload.session_id) {
      return NextResponse.json({ message: "user_id, concept_id, and session_id are required." }, { status: 400 });
    }
    if (payload.track !== "Math" && payload.track !== "ELA") {
      return NextResponse.json({ message: "track must be Math or ELA." }, { status: 400 });
    }

    const response = generateContent(payload);
    return NextResponse.json(response);
  } catch (error) {
    return NextResponse.json(
      { message: (error as Error).message || "Unable to generate content." },
      { status: 403 },
    );
  }
}
