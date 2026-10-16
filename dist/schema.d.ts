import type { Hooks } from "@opencode-ai/plugin";
import { Schema } from "effect";
import type { LangfuseClient } from "./langfuse.js";
type LegacySessionNextStepStartedEvent = {
    id: string;
    type: "session.next.step.started";
    properties: {
        sessionID: string;
        timestamp: number;
        agent: string;
        model: Parameters<LangfuseClient["startActiveGenerationStep"]>[0]["model"];
        snapshot?: string;
    };
};
type LegacySessionNextStepEndedEvent = {
    id: string;
    type: "session.next.step.ended";
    properties: {
        sessionID: string;
        timestamp: number;
        finish: string;
        cost: number;
        tokens: {
            input: number;
            output: number;
            reasoning: number;
            cache: {
                read: number;
                write: number;
            };
        };
        snapshot?: string;
    };
};
type LegacySessionNextStepFailedEvent = {
    id: string;
    type: "session.next.step.failed";
    properties: {
        sessionID: string;
        timestamp: number;
        error: {
            type: "unknown";
            message: string;
        };
    };
};
type LegacySessionNextToolCalledEvent = {
    id: string;
    type: "session.next.tool.called";
    properties: {
        sessionID: string;
        timestamp: number;
        callID: string;
        tool: string;
        input: Record<string, unknown>;
        provider: {
            executed: boolean;
            metadata?: Record<string, unknown>;
        };
    };
};
type LegacySessionNextRetriedEvent = {
    id: string;
    type: "session.next.retried";
    properties: {
        sessionID: string;
        timestamp: number;
        attempt: number;
        error: {
            message: string;
            isRetryable: boolean;
            statusCode?: number;
            responseHeaders?: Record<string, string>;
            responseBody?: string;
            metadata?: Record<string, string>;
        };
    };
};
type LegacySessionNextReasoningEndedEvent = {
    id: string;
    type: "session.next.reasoning.ended";
    properties: {
        sessionID: string;
        timestamp: number;
        reasoningID: string;
        text: string;
    };
};
type LegacySessionNextCompactionEndedEvent = {
    id: string;
    type: "session.next.compaction.ended";
    properties: {
        sessionID: string;
        timestamp: number;
        text: string;
        include?: string;
    };
};
type LegacySessionNextEvent = LegacySessionNextStepStartedEvent | LegacySessionNextStepEndedEvent | LegacySessionNextStepFailedEvent | LegacySessionNextToolCalledEvent | LegacySessionNextRetriedEvent | LegacySessionNextReasoningEndedEvent | LegacySessionNextCompactionEndedEvent;
type SessionNextStepStartedEvent = {
    id: string;
    type: "session.next.step.started";
    properties: {
        sessionID: string;
        timestamp: number;
        assistantMessageID: string;
        agent: string;
        model: Parameters<LangfuseClient["startActiveGenerationStep"]>[0]["model"];
        snapshot?: string;
    };
};
type SessionNextStepEndedEvent = {
    id: string;
    type: "session.next.step.ended";
    properties: {
        sessionID: string;
        timestamp: number;
        assistantMessageID: string;
        finish: string;
        cost: number;
        tokens: {
            input: number;
            output: number;
            reasoning: number;
            cache: {
                read: number;
                write: number;
            };
        };
        snapshot?: string;
        files?: string[];
    };
};
type SessionNextStepFailedEvent = {
    id: string;
    type: "session.next.step.failed";
    properties: {
        sessionID: string;
        timestamp: number;
        assistantMessageID: string;
        error: {
            type: "unknown";
            message: string;
        };
    };
};
type SessionNextToolCalledEvent = {
    id: string;
    type: "session.next.tool.called";
    properties: {
        sessionID: string;
        timestamp: number;
        assistantMessageID: string;
        callID: string;
        tool: string;
        input: Record<string, unknown>;
        provider: {
            executed: boolean;
            metadata?: Record<string, Record<string, unknown>>;
        };
    };
};
type SessionNextRetriedEvent = {
    id: string;
    type: "session.next.retried";
    properties: {
        sessionID: string;
        timestamp: number;
        attempt: number;
        error: {
            message: string;
            isRetryable: boolean;
            statusCode?: number;
            responseHeaders?: Record<string, string>;
            responseBody?: string;
            metadata?: Record<string, string>;
        };
    };
};
type SessionNextReasoningEndedEvent = {
    id: string;
    type: "session.next.reasoning.ended";
    properties: {
        sessionID: string;
        timestamp: number;
        assistantMessageID: string;
        reasoningID: string;
        text: string;
        providerMetadata?: Record<string, Record<string, unknown>>;
    };
};
type SessionNextCompactionEndedEvent = {
    id: string;
    type: "session.next.compaction.ended";
    properties: {
        sessionID: string;
        timestamp: number;
        messageID: string;
        reason: "auto" | "manual";
        text: string;
        recent: string;
    };
};
type CurrentSessionNextEvent = SessionNextStepStartedEvent | SessionNextStepEndedEvent | SessionNextStepFailedEvent | SessionNextToolCalledEvent | SessionNextRetriedEvent | SessionNextReasoningEndedEvent | SessionNextCompactionEndedEvent;
type SessionNextEvent = LegacySessionNextEvent | CurrentSessionNextEvent;
export type OpencodeEvent = Parameters<NonNullable<Hooks["event"]>>[0]["event"] | SessionNextEvent;
export declare const NativeToolResultSchema: Schema.Struct<{
    title: typeof Schema.String;
    metadata: Schema.Record$<typeof Schema.String, typeof Schema.Unknown>;
    output: typeof Schema.String;
    attachments: Schema.optional<Schema.Array$<typeof Schema.Unknown>>;
}>;
export declare const McpToolResultSchema: Schema.Struct<{
    content: Schema.Array$<typeof Schema.Unknown>;
    structuredContent: Schema.optional<Schema.Record$<typeof Schema.String, typeof Schema.Unknown>>;
    isError: Schema.optional<typeof Schema.Boolean>;
    _meta: Schema.optional<Schema.Record$<typeof Schema.String, typeof Schema.Unknown>>;
}>;
export declare const McpContentSchema: Schema.Union<[Schema.Struct<{
    type: Schema.Literal<["text"]>;
    text: typeof Schema.String;
}>, Schema.Struct<{
    type: Schema.Literal<["image"]>;
    data: typeof Schema.String;
    mimeType: typeof Schema.String;
}>, Schema.Struct<{
    type: Schema.Literal<["resource"]>;
    resource: Schema.Union<[Schema.Struct<{
        uri: typeof Schema.String;
        mimeType: Schema.optional<typeof Schema.String>;
        text: typeof Schema.String;
    }>, Schema.Struct<{
        uri: typeof Schema.String;
        mimeType: Schema.optional<typeof Schema.String>;
        blob: typeof Schema.String;
    }>]>;
}>]>;
export {};
//# sourceMappingURL=schema.d.ts.map