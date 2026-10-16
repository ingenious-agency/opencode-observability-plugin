import { A as Tag, C as runPromise, D as zipRight, E as try_, M as isSome, O as merge$1, S as provide, T as tryPromise, _ as catchAll, a as Boolean$, b as gen, c as String$, d as Unknown, f as optional, g as asVoid, h as as, i as Array$, j as isNone, k as succeed$1, l as Struct, m as _void, n as LangfuseClientService, o as Literal, p as decodeUnknownOption, r as buildSessionHistory, s as Record, t as createLangfuseRuntime, u as Union, v as catchAllDefect, w as sync, x as promise, y as catchTag } from "./runtime-CHfhTWIR.js";
//#region node_modules/.pnpm/effect@3.22.1/node_modules/effect/dist/esm/Layer.js
/**
* Merges this layer with the specified layer concurrently, producing a new layer with combined input and output types.
*
* @since 2.0.0
* @category zipping
*/
const merge = merge$1;
/**
* Constructs a layer from the specified value.
*
* @since 2.0.0
* @category constructors
*/
const succeed = succeed$1;
//#endregion
//#region src/opencode.ts
var OpencodeClientService = class extends Tag("OpencodeClientService")() {};
//#endregion
//#region src/schema.ts
const NativeToolResultSchema = Struct({
	title: String$,
	metadata: Record({
		key: String$,
		value: Unknown
	}),
	output: String$,
	attachments: optional(Array$(Unknown))
});
const McpToolResultSchema = Struct({
	content: Array$(Unknown),
	structuredContent: optional(Record({
		key: String$,
		value: Unknown
	})),
	isError: optional(Boolean$),
	_meta: optional(Record({
		key: String$,
		value: Unknown
	}))
});
const McpResourceContentsSchema = Union(Struct({
	uri: String$,
	mimeType: optional(String$),
	text: String$
}), Struct({
	uri: String$,
	mimeType: optional(String$),
	blob: String$
}));
const McpContentSchema = Union(Struct({
	type: Literal("text"),
	text: String$
}), Struct({
	type: Literal("image"),
	data: String$,
	mimeType: String$
}), Struct({
	type: Literal("resource"),
	resource: McpResourceContentsSchema
}));
//#endregion
//#region src/utils.ts
const log = (level, message) => gen(function* () {
	const opencode = yield* OpencodeClientService;
	yield* tryPromise(() => opencode.app.log({ body: {
		service: "langfuse",
		level,
		message
	} }));
});
//#endregion
//#region src/v1.ts
const refreshSessionHistory = (sessionID) => gen(function* () {
	const opencode = yield* OpencodeClientService;
	const langfuse = yield* LangfuseClientService;
	const response = yield* tryPromise({
		try: () => opencode.session.messages({ path: { id: sessionID } }),
		catch: (error) => error
	}).pipe(catchAll((error) => log("info", `Reading the conversation of session ${sessionID} failed: ${formatHookError(error)}`).pipe(as(void 0))));
	if (response === void 0) return;
	if (response.data === void 0) {
		yield* log("info", `OpenCode returned no messages for session ${sessionID}; keeping the previous conversation snapshot`);
		return;
	}
	langfuse.setSessionHistory(sessionID, buildSessionHistory(response.data));
});
const eventHook = (event) => gen(function* () {
	const langfuse = yield* LangfuseClientService;
	const finalizeSessionTracing = (sessionID) => {
		langfuse.endActiveToolObservations(sessionID);
		langfuse.endActiveGenerationSteps(sessionID);
		langfuse.endActiveTurnObservations(sessionID);
		if (sessionID !== void 0 && sessionID !== "") langfuse.clearSessionTraceState(sessionID);
		else langfuse.clearTraceState();
	};
	if (event.type === "session.idle") {
		yield* log("info", "Flushing spans");
		finalizeSessionTracing(event.properties.sessionID);
		yield* langfuse.forceFlush;
	}
	if (event.type === "server.instance.disposed") {
		finalizeSessionTracing();
		yield* langfuse.forceFlush;
	}
	if (event.type === "session.created" || event.type === "session.updated") langfuse.rememberSessionParent({
		sessionID: event.properties.info.id,
		parentSessionID: event.properties.info.parentID
	});
	if (event.type === "session.deleted") langfuse.rememberSessionParent({ sessionID: event.properties.info.id });
	if (event.type === "session.error" && event.properties.sessionID != null) langfuse.traceSessionError({
		sessionID: event.properties.sessionID,
		error: event.properties.error
	});
	if (event.type === "message.part.updated") {
		const part = event.properties.part;
		langfuse.rememberAssistantPart(part);
		langfuse.traceReasoningPart(part);
		if (part.type === "tool" && part.state.status === "running") langfuse.traceToolStart({
			sessionID: part.sessionID,
			messageID: part.messageID,
			callID: part.callID,
			tool: part.tool,
			args: part.state.input,
			started: part.state.time.start
		});
		if (part.type === "tool" && part.state.status === "completed") langfuse.traceToolEnd({
			sessionID: part.sessionID,
			messageID: part.messageID,
			callID: part.callID,
			tool: part.tool,
			args: part.state.input,
			title: part.state.title,
			output: part.state.output,
			started: part.state.time.start,
			completed: part.state.time.end
		});
		if (part.type === "tool" && part.state.status === "error") langfuse.traceToolError({
			sessionID: part.sessionID,
			messageID: part.messageID,
			callID: part.callID,
			tool: part.tool,
			args: part.state.input,
			error: part.state.error,
			started: part.state.time.start,
			completed: part.state.time.end
		});
	}
	if (event.type === "session.next.step.started") {
		yield* refreshSessionHistory(event.properties.sessionID);
		langfuse.startActiveGenerationStep({
			sessionID: event.properties.sessionID,
			assistantMessageID: "assistantMessageID" in event.properties ? event.properties.assistantMessageID : void 0,
			agent: event.properties.agent,
			model: event.properties.model,
			started: event.properties.timestamp,
			snapshot: event.properties.snapshot
		});
	}
	if (event.type === "session.next.step.failed") langfuse.traceFailedGenerationStep({
		id: event.id,
		sessionID: event.properties.sessionID,
		assistantMessageID: "assistantMessageID" in event.properties ? event.properties.assistantMessageID : void 0,
		completed: event.properties.timestamp,
		error: event.properties.error
	});
	if (event.type === "session.next.tool.called" && "assistantMessageID" in event.properties) langfuse.rememberToolCall({
		callID: event.properties.callID,
		messageID: event.properties.assistantMessageID,
		sessionID: event.properties.sessionID,
		tool: event.properties.tool,
		args: event.properties.input
	});
	if (event.type === "session.next.retried") langfuse.traceEvent({
		id: event.id,
		sessionID: event.properties.sessionID,
		name: "opencode.generation.retry",
		timestamp: event.properties.timestamp,
		output: event.properties.error,
		metadata: { attempt: event.properties.attempt }
	});
	if (event.type === "session.next.reasoning.ended" && "assistantMessageID" in event.properties) langfuse.rememberReasoning({
		reasoningID: event.properties.reasoningID,
		sessionID: event.properties.sessionID,
		timestamp: event.properties.timestamp,
		text: event.properties.text,
		messageID: event.properties.assistantMessageID
	});
	if (event.type === "session.next.compaction.ended") {
		const metadata = "messageID" in event.properties ? {
			messageID: event.properties.messageID,
			reason: event.properties.reason,
			recent: event.properties.recent
		} : { include: event.properties.include };
		langfuse.traceEvent({
			id: event.id,
			sessionID: event.properties.sessionID,
			name: "opencode.generation.compaction",
			timestamp: event.properties.timestamp,
			output: { text: event.properties.text },
			metadata
		});
	}
	if (event.type === "message.updated") {
		const message = event.properties.info;
		if (message.role !== "assistant") return;
		if (!langfuse.hasSessionHistory(message.sessionID)) yield* refreshSessionHistory(message.sessionID);
		langfuse.startActiveGenerationStep({
			sessionID: message.sessionID,
			assistantMessageID: message.id,
			agent: message.mode,
			model: {
				id: message.modelID,
				providerID: message.providerID
			},
			started: message.time.created
		});
		if (message.time.completed === void 0) return;
		langfuse.traceGeneration({
			sessionID: message.sessionID,
			messageID: message.id,
			parentID: message.parentID,
			modelID: message.modelID,
			providerID: message.providerID,
			agent: message.mode,
			mode: message.mode,
			created: message.time.created,
			completed: message.time.completed,
			finish: message.finish,
			cost: message.cost,
			tokens: message.tokens
		});
	}
});
const formatHookError = (error) => {
	if (error instanceof Error) return error.stack ?? error.message;
	try {
		return JSON.stringify(error);
	} catch {
		return String(error);
	}
};
const flattenMcpContent = (content) => {
	const textParts = [];
	for (const part of content) {
		const decoded = decodeUnknownOption(McpContentSchema)(part);
		if (isNone(decoded)) continue;
		if (decoded.value.type === "text") {
			textParts.push(decoded.value.text);
			continue;
		}
		if (decoded.value.type === "resource" && "text" in decoded.value.resource) textParts.push(decoded.value.resource.text);
	}
	return textParts.join("\n\n");
};
const normalizeToolResult = (tool, output) => {
	const nativeResult = decodeUnknownOption(NativeToolResultSchema)(output);
	if (isSome(nativeResult)) return {
		title: nativeResult.value.title,
		output: nativeResult.value.output,
		isError: false,
		unexpected: false
	};
	const mcpResult = decodeUnknownOption(McpToolResultSchema)(output);
	if (isSome(mcpResult)) return {
		title: tool,
		output: flattenMcpContent(mcpResult.value.content),
		isError: mcpResult.value.isError === true,
		unexpected: false
	};
	if (output === void 0 || output === null) return {
		title: tool,
		output: "",
		isError: false,
		unexpected: false
	};
	return {
		title: tool,
		output: "",
		isError: false,
		unexpected: true
	};
};
const main = gen(function* () {
	const opencode = yield* OpencodeClientService;
	const disableTracing = (error) => log("warn", `[Tracing disabled] ${error.message}`).pipe(as(void 0));
	const langfuse = yield* createLangfuseRuntime({}).pipe(catchTag("MissingLangfuseCredentials", disableTracing));
	if (!langfuse) return {};
	yield* log("info", `OTEL tracing initialized → ${langfuse.baseUrl}`);
	const hooksLayer = merge(succeed(OpencodeClientService, opencode), succeed(LangfuseClientService, langfuse));
	const finalizeTracing = sync(() => {
		langfuse.endActiveToolObservations();
		langfuse.endActiveGenerationSteps();
		langfuse.endActiveTurnObservations();
		langfuse.clearTraceState();
	});
	const toolDefinitions = /* @__PURE__ */ new Map();
	const runHook = (hookName, effect) => runPromise(effect.pipe(catchAllDefect((defect) => log("error", `Langfuse hook "${hookName}" failed: ${formatHookError(defect)}`).pipe(catchAll(() => _void))), catchAll((error) => log("error", `Langfuse hook "${hookName}" failed: ${formatHookError(error)}`).pipe(catchAll(() => _void))), asVoid, provide(hooksLayer)));
	return {
		dispose: () => runHook("dispose", finalizeTracing.pipe(zipRight(langfuse.forceFlush))),
		event: ({ event }) => runHook("event", eventHook(event)),
		"chat.message": (input, output) => runHook("chat.message", gen(function* () {
			let tools;
			if (input.model) {
				const enabledTools = output.message.tools;
				const cacheKey = JSON.stringify([
					input.model.providerID,
					input.model.modelID,
					enabledTools
				]);
				let pendingTools = toolDefinitions.get(cacheKey);
				if (!pendingTools) {
					pendingTools = opencode.tool.list({ query: {
						provider: input.model.providerID,
						model: input.model.modelID
					} }).then(({ data }) => (data ?? []).filter((tool) => enabledTools?.[tool.id] !== false).map((tool) => ({
						name: tool.id,
						description: tool.description,
						...typeof tool.parameters === "object" && tool.parameters !== null && !Array.isArray(tool.parameters) ? { parameters: tool.parameters } : {}
					}))).catch(() => {
						toolDefinitions.delete(cacheKey);
						return [];
					});
					toolDefinitions.set(cacheKey, pendingTools);
				}
				tools = yield* promise(() => pendingTools);
			}
			yield* sync(() => {
				langfuse.traceUserMessage({
					sessionID: input.sessionID,
					messageID: input.messageID,
					agent: input.agent,
					model: input.model,
					parts: output.parts,
					tools
				});
			});
		})),
		"tool.execute.before": (input, output) => runHook("tool.execute.before", try_({
			try: () => {
				langfuse.traceToolStart({
					sessionID: input.sessionID,
					callID: input.callID,
					tool: input.tool,
					args: output.args
				});
			},
			catch: (error) => error
		})),
		"tool.execute.after": (input, output) => runHook("tool.execute.after", gen(function* () {
			const normalized = normalizeToolResult(input.tool, output);
			if (normalized.unexpected) yield* log("warn", `Tool "${input.tool}" returned an unrecognized result shape; recording empty output`);
			if (normalized.isError) {
				yield* sync(() => {
					langfuse.traceToolError({
						sessionID: input.sessionID,
						callID: input.callID,
						tool: input.tool,
						args: input.args,
						error: normalized.output || `MCP tool "${input.tool}" returned an error`,
						completed: Date.now()
					});
				});
				return;
			}
			yield* try_({
				try: () => {
					langfuse.traceToolEnd({
						sessionID: input.sessionID,
						callID: input.callID,
						tool: input.tool,
						args: input.args,
						title: normalized.title,
						output: normalized.output
					});
				},
				catch: (error) => error
			});
		}))
	};
});
const LangfusePlugin = async ({ client }) => {
	const clientLayer = succeed(OpencodeClientService, client);
	return runPromise(main.pipe(provide(clientLayer)));
};
//#endregion
export { LangfusePlugin as t };

//# sourceMappingURL=v1-DhRRLcft.js.map