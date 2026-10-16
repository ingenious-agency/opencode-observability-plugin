import type { Hooks } from "@opencode-ai/plugin";
import type { Span as ApiSpan, Tracer } from "@opentelemetry/api";
import type { Span } from "@opentelemetry/sdk-trace-base";
import { Context as EffectContext, Effect, Schema } from "effect";
export declare class LangfuseClient {
    readonly baseUrl: string;
    readonly forceFlush: Effect.Effect<void, unknown>;
    private readonly traceState;
    private readonly assistantParents;
    constructor(input: {
        baseUrl: string;
        traceState: LangfuseTraceState;
        forceFlush: Effect.Effect<void, unknown>;
    });
    clearTraceState(): void;
    labelSession(input: {
        sessionID: string;
        metadata?: unknown;
    }): void;
    clearSessionTraceState(sessionID: string): void;
    endActiveToolObservations(sessionID?: string, error?: SessionErrorInfo): void;
    endActiveGenerationSteps(sessionID?: string, error?: SessionErrorInfo): void;
    endActiveTurnObservations(sessionID?: string): void;
    rememberSessionParent(input: {
        sessionID: string;
        parentSessionID?: string;
    }): void;
    traceEvent(input: {
        id: string;
        sessionID: string;
        name: string;
        timestamp: number;
        input?: unknown;
        output?: unknown;
        metadata?: unknown;
        parentSpan?: ApiSpan;
    }): void;
    rememberReasoning(input: {
        reasoningID: string;
        sessionID: string;
        timestamp: number;
        text: string;
        messageID?: string;
    }): void;
    traceReasoningPart(part: MessagePart): void;
    startActiveGenerationStep(input: {
        sessionID: string;
        assistantMessageID?: string;
        agent: string;
        model: NonNullable<ActiveGenerationStep["model"]>;
        started: number;
        snapshot?: string;
    }): void;
    traceUserMessage(input: {
        sessionID: string;
        messageID?: string;
        agent?: string;
        model?: {
            providerID: string;
            modelID: string;
        };
        parts: MessagePart[];
        tools?: ToolDefinition[];
    }): void;
    traceUserPrompt(input: {
        sessionID: string;
        messageID?: string;
        content: FormattedMessagePart[];
        tools?: ToolDefinition[];
    }): void;
    setPendingToolDefinitions(sessionID: string, tools: ToolDefinition[]): void;
    setGenerationInputSnapshot(sessionID: string, input: unknown): void;
    private traceFormattedUserMessage;
    rememberAssistantPart(part: MessagePart): void;
    rememberToolCall(input: {
        callID: string;
        messageID: string;
        sessionID: string;
        tool: string;
        args: Record<string, unknown>;
    }): void;
    traceGeneration(input: {
        sessionID: string;
        messageID: string;
        parentID: string;
        modelID: string;
        providerID: string;
        agent?: string;
        mode: string;
        created: number;
        completed: number;
        finish?: string;
        cost: number;
        output?: unknown;
        tokens: {
            total?: number;
            input: number;
            output: number;
            reasoning: number;
            cache: {
                read: number;
                write: number;
            };
        };
    }): void;
    traceFailedGenerationStep(input: {
        id: string;
        sessionID: string;
        assistantMessageID?: string;
        completed: number;
        error: {
            message: string;
        };
    }): void;
    traceSessionError(input: {
        sessionID: string;
        error?: SessionErrorInfo;
    }): void;
    traceToolStart(input: {
        sessionID: string;
        callID: string;
        tool: string;
        args: unknown;
        messageID?: string;
        started?: number;
    }): void;
    traceToolEnd(input: {
        sessionID: string;
        callID: string;
        tool: string;
        args: unknown;
        title: string;
        output: string;
        messageID?: string;
        started?: number;
        completed?: number;
    }): void;
    traceToolError(input: {
        callID: string;
        error: string;
        completed: number;
        sessionID?: string;
        tool?: string;
        args?: unknown;
        messageID?: string;
        started?: number;
    }): void;
    private ensureGenerationParent;
    private withTurnParent;
    private getTurnObservation;
    private getSessionParentSpan;
    private withObservationParent;
    private getAssistantMessage;
    setSessionHistory(sessionID: string, history: SessionHistory): void;
    hasSessionHistory(sessionID: string): boolean;
    private getHistoryPrefix;
    private snapshotHolds;
    private consumeGenerationInput;
    private rememberToolResult;
    private getSessionErrorMessage;
}
export type LangfuseTraceState = {
    tracerName: string;
    tracer: Tracer;
    abortedSessions: Set<string>;
    tracedMessageIds: Set<string>;
    tracedGenerationIds: Set<string>;
    tracedEventIds: Set<string>;
    tracedReasoningIds: Set<string>;
    generationSpansByMessageId: Map<string, ApiSpan>;
    activeGenerationStepsByMessageId: Map<string, ActiveGenerationStep>;
    toolMessageIdsByCallId: Map<string, string>;
    assistantParts: Map<string, Map<string, MessagePart>>;
    turnObservationsByMessageId: Map<string, TurnObservation>;
    latestTurnObservationsBySession: Map<string, TurnObservation>;
    activeToolObservations: Map<string, ToolObservation>;
    finalizedToolCallIds: Set<string>;
    activeGenerationSteps: Map<string, ActiveGenerationStep>;
    generationParentSpans: Map<string, ApiSpan>;
    generationInputsBySession: Map<string, ChatMlMessage[]>;
    generationInputSnapshotsBySession: Map<string, unknown>;
    sessionParentIds: Map<string, string>;
    sessionHistories: Map<string, SessionHistory>;
    pendingUserMessageIdsBySession: Map<string, string>;
    sessionLabels: Map<string, SessionLabels>;
};
declare const PromptMetadataSchema: Schema.Struct<{
    langfuse: Schema.Struct<{
        sessionId: Schema.optional<typeof Schema.NonEmptyString>;
        traceName: Schema.optional<typeof Schema.NonEmptyString>;
        tags: Schema.optional<Schema.Array$<typeof Schema.String>>;
        metadata: Schema.optional<Schema.Record$<typeof Schema.String, typeof Schema.Unknown>>;
    }>;
}>;
type SessionLabels = typeof PromptMetadataSchema.Type.langfuse;
/** @internal */
export declare const parseSessionLabels: (metadata: unknown) => {
    readonly metadata?: {
        readonly [x: string]: unknown;
    } | undefined;
    readonly sessionId?: string | undefined;
    readonly traceName?: string | undefined;
    readonly tags?: readonly string[] | undefined;
} | undefined;
export type MessagePart = Extract<Parameters<NonNullable<Hooks["event"]>>[0]["event"], {
    type: "message.part.updated";
}>["properties"]["part"];
export type SessionHistory = {
    messages: ChatMlMessage[];
    userMessages: Map<string, number>;
    assistantMessages: Map<string, {
        startIndex: number;
        endIndex: number;
        parts: MessagePart[];
    }>;
    messageIds: Set<string>;
};
export declare function buildSessionHistory(messages: readonly {
    info: {
        id: string;
        role: string;
    };
    parts: MessagePart[];
}[]): SessionHistory;
type FormattedMessagePart = {
    type: string;
    text: string;
} | {
    type: string;
    filename?: string;
    url?: string;
} | {
    type: string;
    name?: string;
} | {
    type: string;
    prompt?: string;
    agent?: string;
} | {
    type: string;
    tool?: string;
    title?: string;
} | {
    type: string;
};
type SessionError = Extract<Parameters<NonNullable<Hooks["event"]>>[0]["event"], {
    type: "session.error";
}>["properties"]["error"];
export type SessionErrorInfo = NonNullable<SessionError> | {
    name: string;
    message?: string;
    data?: {
        message?: unknown;
    };
};
type UserMessageInput = {
    role: "user";
    content: FormattedMessagePart[];
    tools?: ToolDefinition[];
};
export type ToolDefinition = {
    name: string;
    description?: string;
    parameters?: object;
};
type ChatMlMessage = UserMessageInput | {
    role: "tool";
    name: string;
    tool_call_id: string;
    content: string;
} | NonNullable<ReturnType<LangfuseClient["getAssistantMessage"]>>[number];
export type TurnObservation = {
    span: ApiSpan;
    sessionID: string;
    messageID?: string;
};
export type ToolObservation = {
    span: ApiSpan;
    sessionID: string;
    tool: string;
};
export type ActiveGenerationStep = {
    sessionID: string;
    messageID?: string;
    agent?: string;
    model?: {
        id: string;
        providerID: string;
        variant?: string;
    };
    span: ApiSpan;
    snapshot?: string;
};
declare const LangfuseClientService_base: EffectContext.TagClass<LangfuseClientService, "LangfuseClientService", LangfuseClient>;
export declare class LangfuseClientService extends LangfuseClientService_base {
}
/** @internal */
export declare const makeSessionLabelSpanProcessor: (traceState: Pick<LangfuseTraceState, "sessionLabels" | "sessionParentIds">) => {
    onStart: (span: Span) => void;
    onEnd: () => undefined;
    shutdown: () => Promise<void>;
    forceFlush: () => Promise<void>;
};
export declare const createLangfuseClient: (input: {
    publicKey: string;
    secretKey: string;
    baseUrl: string;
    environment: string;
    userId?: string;
    serviceName?: string;
    opencodeVersion?: string;
}) => Effect.Effect<LangfuseClient, never, never>;
export {};
//# sourceMappingURL=langfuse.d.ts.map