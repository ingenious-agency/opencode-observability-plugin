import {
  BasicTracerProvider,
  InMemorySpanExporter,
  SimpleSpanProcessor,
} from "@opentelemetry/sdk-trace-base";
import { describe, expect, test, vi } from "vitest";

import {
  makeSessionLabelSpanProcessor,
  parseSessionLabels,
} from "../../src/langfuse.js";

vi.hoisted(() => {
  vi.stubGlobal("__PLUGIN_VERSION__", "test");
});

describe("session labels", () => {
  test("parses only well-formed langfuse prompt metadata", () => {
    expect(
      parseSessionLabels({
        loopRequestId: "ignored",
        langfuse: { sessionId: "run-1", tags: ["loop"] },
      }),
    ).toEqual({ sessionId: "run-1", tags: ["loop"] });
    expect(parseSessionLabels(undefined)).toBeUndefined();
    expect(parseSessionLabels({ other: true })).toBeUndefined();
    expect(parseSessionLabels({ langfuse: { tags: [3] } })).toBeUndefined();
  });

  test("applies labels to the session and its subagents", () => {
    const traceState = {
      sessionLabels: new Map([
        [
          "session-1",
          {
            sessionId: "run-1",
            tags: ["loop", "stage:build"],
            metadata: { stageId: "build", attempt: 2 },
          },
        ],
      ]),
      sessionParentIds: new Map([["child-1", "session-1"]]),
    };
    const exporter = new InMemorySpanExporter();
    const tracer = new BasicTracerProvider({
      spanProcessors: [
        makeSessionLabelSpanProcessor(traceState),
        new SimpleSpanProcessor(exporter),
      ],
    }).getTracer("test");
    for (const sessionID of ["session-1", "child-1", "plain"]) {
      tracer
        .startSpan("span", { attributes: { "session.id": sessionID } })
        .end();
    }

    const labeled = {
      "session.id": "run-1",
      "langfuse.trace.tags": ["loop", "stage:build"],
      "langfuse.trace.metadata.stageId": "build",
      "langfuse.trace.metadata.attempt": "2",
    };
    expect(exporter.getFinishedSpans().map((span) => span.attributes)).toEqual([
      {
        ...labeled,
        "langfuse.trace.metadata.opencodeSessionID": "session-1",
      },
      { ...labeled, "langfuse.trace.metadata.opencodeSessionID": "child-1" },
      { "session.id": "plain" },
    ]);
  });
});
