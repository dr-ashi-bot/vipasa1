import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import OpenAI from "openai";
import type { SubjectTrack } from "../types";

interface GeneratedProblem {
  problem_markdown: string;
  expected_answer_format: string;
  curiosity_teaser: string;
}

@Injectable()
export class AiTutorService {
  private readonly model: string;
  private readonly client: OpenAI | null;

  constructor(private readonly configService: ConfigService) {
    this.model = this.configService.get<string>("OPENAI_MODEL", "gpt-4o");
    const apiKey = this.configService.get<string>("OPENAI_API_KEY");
    this.client = apiKey && apiKey !== "replace_me" ? new OpenAI({ apiKey }) : null;
  }

  async generateProblem(params: {
    userName: string;
    interests: string[];
    conceptId: string;
    track: SubjectTrack;
    memorySnippets: string[];
  }): Promise<GeneratedProblem> {
    if (!this.client) {
      return this.fallbackProblem(params);
    }

    const lexileConstraint =
      params.track === "ELA"
        ? "Use 4th-grade Lexile language: short sentences, decodable words, explicit clarity."
        : "Use rigorous 6th-grade puzzle logic in Beast Academy/AoPS style while keeping instructions concise.";

    const systemPrompt = [
      "You are an empathetic Socratic tutor for a pre-teen learner.",
      "Persona Pattern: warm, encouraging, curious, never patronizing.",
      "Role Prompting: coach metacognition and discovery, not answer delivery.",
      "Always make Ashi the main character.",
      "Always include both themes: gymnastics and cute puppies.",
      "Structure every task as a multi-part story that creates a curiosity gap.",
      "Output markdown with headings: Story, Challenge, Answer Format, Next Cliffhanger.",
      lexileConstraint,
    ].join(" ");

    const userPrompt = [
      `Learner profile: name=${params.userName}; interests=${params.interests.join(", ")}.`,
      `Track=${params.track}; concept=${params.conceptId}.`,
      "Recent memory snippets:",
      ...params.memorySnippets.map((snippet, idx) => `${idx + 1}. ${snippet}`),
    ].join("\n");

    const response = await this.client.responses.create({
      model: this.model,
      input: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.8,
    });

    const output = response.output_text?.trim();
    if (!output) {
      return this.fallbackProblem(params);
    }

    return {
      problem_markdown: output,
      expected_answer_format:
        params.track === "Math" ? "single numeric or algebraic expression" : "one clear sentence",
      curiosity_teaser:
        "Solve this part to reveal what happens next in Ashi's puppy-and-gymnastics adventure.",
    };
  }

  async generateSingleSocraticQuestion(params: {
    userName: string;
    conceptId: string;
    track: SubjectTrack;
    learnerResponse?: string;
    misconceptionSnippets: string[];
  }): Promise<string> {
    if (!this.client) {
      return this.fallbackSocraticQuestion(params.track, params.conceptId);
    }

    const systemPrompt = [
      "You are an empathetic Socratic tutor.",
      "Ask exactly ONE guiding question.",
      "Do not give away the answer.",
      "Question must be concise and metacognitive.",
      "Address Ashi directly and keep language age-appropriate.",
      params.track === "ELA"
        ? "Keep wording at 4th-grade Lexile level."
        : "Keep mathematical rigor but avoid heavy text load.",
    ].join(" ");

    const userPrompt = [
      `Concept: ${params.conceptId}`,
      `Ashi's response: ${params.learnerResponse ?? "No response text provided."}`,
      "Similar past misconceptions:",
      ...params.misconceptionSnippets.map((snippet, idx) => `${idx + 1}. ${snippet}`),
    ].join("\n");

    const response = await this.client.responses.create({
      model: this.model,
      input: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      temperature: 0.6,
    });
    const text = response.output_text?.trim();
    if (!text) {
      return this.fallbackSocraticQuestion(params.track, params.conceptId);
    }

    return this.enforceSingleQuestion(text);
  }

  private fallbackProblem(params: {
    userName: string;
    interests: string[];
    conceptId: string;
    track: SubjectTrack;
  }): GeneratedProblem {
    const [interestA, interestB] = params.interests;
    if (params.track === "Math") {
      return {
        problem_markdown: [
          "### Story",
          `${params.userName} is practicing a gymnastics routine while two cute puppies carry numbered cards.`,
          "### Challenge",
          "The first puppy shows -8 and the second shows +13. Ashi combines both cards to unlock the balance beam clue.",
          "What integer result should she write?",
          "### Answer Format",
          "Write one integer.",
          "### Next Cliffhanger",
          `If you solve this, Ashi learns which 3D shape appears in the puppies' treasure map next.`,
        ].join("\n"),
        expected_answer_format: "single integer",
        curiosity_teaser: `Part 2 reveals a new ${interestA} + ${interestB} mystery.`,
      };
    }

    return {
      problem_markdown: [
        "### Story",
        `${params.userName} helps a puppy read signs at gymnastics camp.`,
        "### Challenge",
        "Read this sentence and tell the main idea in one short sentence:",
        "\"The puppy wagged its tail when Ashi landed her cartwheel, so everyone clapped and smiled.\"",
        "### Answer Format",
        "One simple sentence.",
        "### Next Cliffhanger",
        "Your answer unlocks the puppy's next camp clue.",
      ].join("\n"),
      expected_answer_format: "one short sentence",
      curiosity_teaser: `Part 2 reveals the next ${params.conceptId} clue.`,
    };
  }

  private fallbackSocraticQuestion(track: SubjectTrack, conceptId: string): string {
    if (track === "Math") {
      return `Ashi, what is the first small step you can do to simplify ${conceptId} before solving the full problem?`;
    }
    return "Ashi, which key words in the sentence help you decide the main idea?";
  }

  private enforceSingleQuestion(text: string): string {
    const collapsed = text.replace(/\s+/g, " ").trim();
    const questionMatch = collapsed.match(/[^?]*\?/);
    if (!questionMatch) {
      return `${collapsed}?`;
    }
    return questionMatch[0].trim();
  }
}
