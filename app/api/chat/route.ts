import { NextResponse } from "next/server";

import { authorizeAIRequest } from "@/lib/api/authorizeAIRequest";
import { consumeQuota } from "@/lib/api/consumeQuota";
import { isPayloadTooLarge } from "@/lib/api/validateRequestSize";

import { classifyIntent } from "@/lib/ai/chat/classify";
import { generateSQL } from "@/lib/ai/chat/generate";
import { reasoning } from "@/lib/ai/chat/reasoning";
import { conversational } from "@/lib/ai/chat/conversational";
import { ambiguous } from "@/lib/ai/chat/ambiguous";
import { explainSQL } from "@/lib/ai/chat/analysis";

import type { ChatRequest } from "@/lib/ai/chat/types";

export async function POST(req: Request) {
  const auth = await authorizeAIRequest(
    req,
    "chat",
    5,
    60000,
    "Too many AI requests.",
  );

  if (!auth.authorized) return auth.response;

  let body: ChatRequest;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "invalid request body" },
      { status: 400 },
    );
  }

  if (isPayloadTooLarge(body)) {
    return NextResponse.json(
      { error: "Request payload too large" },
      { status: 413 },
    );
  }

  try {
    await consumeQuota(auth.user.id);
  } catch (err) {
    if (err instanceof Error && err.message === "Daily quota exceeded") {
      return NextResponse.json(
        {
          error: "Daily quota exceeded.",
        },
        {
          status: 429,
        },
      );
    }
    throw err;
  }

  switch (body.type) {
    // ===========================
    // CLASSIFY INTENT
    // ===========================
    case "classify-intent": {
      const p = body.payload;

      const intent = await classifyIntent({
        query: p.query,
        schemas: p.schemas,
      });

      if (!intent) {
        return NextResponse.json(
          { error: "Intent classification failed." },
          { status: 500 },
        );
      }

      return NextResponse.json({ intent });
    }

    // ===========================
    // CONVERSATION
    // ===========================
    case "conversation": {
      const p = body.payload;

      const response = await conversational({ query: p.query });

      if (!response) {
        return NextResponse.json(
          { error: "Conversation failed." },
          { status: 500 },
        );
      }

      return NextResponse.json({ response });
    }

    // ===========================
    // REASONING
    // ===========================
    case "reasoning": {
      const p = body.payload;

      const response = await reasoning({
        query: p.query,
        schemas: p.schemas,
        relationships: p.relationships,
        finalDatasetContext: p.finalDatasetContext,
      });

      if (!response) {
        return NextResponse.json(
          { error: "Reasoning failed." },
          { status: 500 },
        );
      }

      return NextResponse.json({ response });
    }

    // ===========================
    // AMBIGUOUS
    // ===========================
    case "ambiguous": {
      const p = body.payload;

      const response = await ambiguous({ query: p.query });

      if (!response) {
        return NextResponse.json(
          { error: "Clarification failed." },
          { status: 500 },
        );
      }

      return NextResponse.json({ response });
    }

    // ===========================
    // ANALYSIS (internal only)
    // ===========================
    case "analysis": {
      const p = body.payload;

      const analysis = await explainSQL({
        query: p.query,
        sql: p.sql,
        result: p.result,
        schemas: p.schemas,
        relationships: p.relationships,
        relevantTables: p.relevantTables ?? [],
        finalDatasetContext: p.datasetContext ?? {},
      });

      if (!analysis) {
        return NextResponse.json(
          { error: "Analysis failed." },
          { status: 500 },
        );
      }

      return NextResponse.json({ response: analysis });
    }

    // ===========================
    // GENERATE
    // ===========================
    case "generate": {
      const p = body.payload;

      const result = await generateSQL({
        query: p.query,
        schemas: p.schemas,
        relevantTables: p.relevantTables,
        relationships: p.relationships,
        finalDatasetContext: p.finalDatasetContext,
        conversationContext: p.conversationContext ?? [],
        timeHint: p.timeHint,
      });

      if (!result) {
        return NextResponse.json(
          { error: "SQL generation failed." },
          { status: 500 },
        );
      }

      if ("error" in result) {
        return NextResponse.json(
          { error: result.error },
          { status: result.status },
        );
      }

      return NextResponse.json({
        type: "DATA_QUERY",
        sql: result.sql,
        relevantTables: p.relevantTables,
        datasetContext: p.finalDatasetContext,
      });
    }
  }
}
