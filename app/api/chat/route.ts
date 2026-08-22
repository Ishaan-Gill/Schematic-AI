import { NextResponse } from "next/server";

import { authorizeAIRequest } from "@/lib/api/authorizeAIRequest";
import { claimTurn } from "@/lib/api/claimTurn";
import { isPayloadTooLarge } from "@/lib/api/validateRequestSize";

import { generateSQL } from "@/lib/ai/chat/generate";
import { reasoning } from "@/lib/ai/chat/reasoning";
import { conversational } from "@/lib/ai/chat/conversational";
import { llmOrchestrate } from "@/lib/ai/chat/llmOrchestrator";
import { dataAnalysis } from "@/lib/ai/chat/dataAnalysis";

import type { ChatRequest } from "@/lib/ai/chat/types";

export async function POST(req: Request) {
  let body: ChatRequest;

  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "invalid request body" },
      { status: 400 },
    );
  }

  const auth = await authorizeAIRequest(
    req,
    "chat",
    5,
    60000,
    "Too many AI requests.",
    { turnId: body.turnId },
  );

  if (!auth.authorized) return auth.response;

  if (isPayloadTooLarge(body)) {
    return NextResponse.json(
      { error: "Request payload too large" },
      { status: 413 },
    );
  }

  if (!body.turnId) {
    return NextResponse.json(
      { error: "Missing turn id" },
      { status: 400 },
    );
  }

  try {
    const claim = await claimTurn(auth.user.id, body.turnId);

    if (claim === "quota-exceeded") {
      return NextResponse.json(
        {
          error:
            "You've reached today's free limit of 20 queries. Please come back tomorrow.",
        },
        {
          status: 429,
        },
      );
    }
  } catch (err) {
    console.error("claim_turn failed:", err);

    return NextResponse.json(
      { error: "Unable to verify your daily quota. Please try again." },
      { status: 503 },
    );
  }

  switch (body.type) {
    // ===========================
    // LLM ORCHESTRATOR
    // ===========================
    case "llm-orchestrate": {
      const p = body.payload;

      const decision = await llmOrchestrate({
        query: p.query,
        conversationContext: p.conversationContext ?? [],
        schemas: p.schemas,
        signal: req.signal,
      });

      if (!decision.ok) {
        return NextResponse.json(
          { error: decision.error },
          { status: 500 },
        );
      }

      return NextResponse.json({
        intent: decision.data.intent,
        needsAnalysis: decision.data.needsAnalysis,
      });
    }

    // ===========================
    // DATA ANALYSIS
    // ===========================
    case "data-analysis": {
      const p = body.payload;

      const result = await dataAnalysis({
        query: p.query,
        sql: p.sql,
        rows: p.result,
        displayedRowCount: p.displayedRowCount,
        hasMore: p.hasMore,
        schemas: p.schemas,
        relevantTables: p.relevantTables,
        relationships: p.relationships,
        finalDatasetContext: p.datasetContext ?? {},
        conversationContext: p.conversationContext ?? [],
        warnings: p.warnings ?? [],
        normalizationNotes: p.normalizationNotes ?? [],
        signal: req.signal,
      });

      if (!result.ok) {
        return NextResponse.json(
          { error: result.error },
          { status: 500 },
        );
      }

      return NextResponse.json({
        analysis: result.data.analysis,
      });
    }

    // ===========================
    // CONVERSATION
    // ===========================
    case "conversation": {
      const p = body.payload;

      const response = await conversational({
        query: p.query,
        conversationContext: p.conversationContext ?? [],
        signal: req.signal,
      });

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
        conversationContext: p.conversationContext ?? [],
        signal: req.signal,
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
        signal: req.signal,
      });

      if (!result) {
        return NextResponse.json(
          { error: "SQL generation failed." },
          { status: 500 },
        );
      }

      if ("error" in result) {
        const status = result.error.code === "INVALID_QUERY" ? 400 : 500;
        return NextResponse.json(
          { error: result.error },
          { status },
        );
      }

      return NextResponse.json({
        type: "DATA_QUERY",
        sql: result.data.sql,
        relevantTables: p.relevantTables,
        datasetContext: p.finalDatasetContext,
      });
    }
  }
}
