import { NextResponse } from "next/server";
import { submitProgress } from "@/lib/engine";
import type { SubjectTrack } from "@/lib/types";

export async function POST(request: Request): Promise<Response> {
  try {
    const payload = (await request.json()) as {
      user_id: string;
      concept_id: string;
      track: SubjectTrack;
      is_correct: boolean;
      learner_response?: string;
      response_time_sec: number;
      session_id: string;
    };
    if (!payload.user_id || !payload.concept_id || !payload.session_id) {
      return NextResponse.json({ message: "Missing required fields." }, { status: 400 });
    }
    if (payload.track !== "Math" && payload.track !== "ELA") {
      return NextResponse.json({ message: "track must be Math or ELA." }, { status: 400 });
    }

    const response = submitProgress(payload);
    return NextResponse.json(response);
  } catch (error) {
    return NextResponse.json(
      { message: (error as Error).message || "Unable to submit progress." },
      { status: 403 },
    );
  }
}
