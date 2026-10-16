import { C as runPromise, h as as, t as createLangfuseRuntime, w as sync, y as catchTag } from "../runtime-CHfhTWIR.js";
//#region src/v2.ts
const LangfusePlugin = {
	id: "langfuse.observability",
	async setup(ctx) {
		const disableTracing = (error) => sync(() => {
			console.warn(`[Langfuse tracing disabled] ${error.message}`);
		}).pipe(as(void 0));
		const langfuse = await runPromise(createLangfuseRuntime({ opencodeVersion: ctx.app.version }).pipe(catchTag("MissingLangfuseCredentials", disableTracing)));
		if (!langfuse) return;
		const abort = new AbortController();
		const registrations = [];
		const userMessageIDs = /* @__PURE__ */ new Map();
		const generationDetails = /* @__PURE__ */ new Map();
		registrations.push(await ctx.session.hook("prompt", (input) => {
			userMessageIDs.set(input.sessionID, input.messageID);
			langfuse.labelSession({
				sessionID: input.sessionID,
				metadata: input.metadata
			});
			langfuse.traceUserPrompt({
				sessionID: input.sessionID,
				messageID: input.messageID,
				content: [
					{
						type: "text",
						text: input.prompt.text
					},
					...(input.prompt.files ?? []).map((file) => ({
						type: "file",
						filename: file.name,
						url: file.uri
					})),
					...(input.prompt.agents ?? []).map((agent) => ({
						type: "agent",
						name: agent.name
					}))
				]
			});
		}));
		registrations.push(await ctx.session.hook("context", (input) => {
			const tools = Object.entries(input.tools).map(([name, tool]) => ({
				name,
				description: tool.description,
				parameters: tool.input
			}));
			langfuse.setGenerationInputSnapshot(input.sessionID, {
				system: input.system,
				messages: input.messages,
				tools
			});
		}));
		registrations.push(await ctx.tool.hook("execute.before", (input) => {
			const content = generationDetails.get(input.messageID)?.content;
			if (content && !content.some((part) => part.type === "tool-call" && part.id === input.id)) content.push({
				type: "tool-call",
				id: input.id,
				name: input.tool,
				input: input.input
			});
			langfuse.rememberToolCall({
				callID: input.id,
				messageID: input.messageID,
				sessionID: input.sessionID,
				tool: input.tool,
				args: typeof input.input === "object" && input.input !== null ? { ...input.input } : {}
			});
			langfuse.traceToolStart({
				sessionID: input.sessionID,
				messageID: input.messageID,
				callID: input.id,
				tool: input.tool,
				args: input.input
			});
		}));
		registrations.push(await ctx.tool.hook("execute.after", (input) => {
			if (input.status === "error") {
				langfuse.traceToolError({
					sessionID: input.sessionID,
					messageID: input.messageID,
					callID: input.id,
					tool: input.tool,
					args: input.input,
					error: input.error.message,
					completed: Date.now()
				});
				return;
			}
			const content = input.result.content;
			const output = typeof content === "string" ? content : (content ?? []).filter((part) => part.type === "text").map((part) => part.text).join("\n\n");
			langfuse.traceToolEnd({
				sessionID: input.sessionID,
				messageID: input.messageID,
				callID: input.id,
				tool: input.tool,
				args: input.input,
				title: input.tool,
				output
			});
		}));
		const events = (async () => {
			try {
				for await (const event of ctx.event.subscribe({ signal: abort.signal })) {
					if (event.type === "session.created") langfuse.rememberSessionParent({
						sessionID: event.data.sessionID,
						parentSessionID: event.data.parentID
					});
					if (event.type === "session.step.started") {
						generationDetails.set(event.data.assistantMessageID, {
							sessionID: event.data.sessionID,
							agent: event.data.agent,
							model: event.data.model,
							started: event.created,
							content: []
						});
						langfuse.startActiveGenerationStep({
							sessionID: event.data.sessionID,
							assistantMessageID: event.data.assistantMessageID,
							agent: event.data.agent,
							model: event.data.model,
							started: event.created,
							snapshot: event.data.snapshot
						});
					}
					if (event.type === "session.text.ended") generationDetails.get(event.data.assistantMessageID)?.content.push({
						type: "text",
						text: event.data.text
					});
					if (event.type === "session.reasoning.ended") generationDetails.get(event.data.assistantMessageID)?.content.push({
						type: "reasoning",
						text: event.data.text
					});
					if (event.type === "session.step.ended") {
						const details = generationDetails.get(event.data.assistantMessageID);
						if (!details) continue;
						langfuse.traceGeneration({
							sessionID: event.data.sessionID,
							messageID: event.data.assistantMessageID,
							parentID: userMessageIDs.get(event.data.sessionID) ?? "",
							modelID: details.model.id,
							providerID: details.model.providerID,
							agent: details.agent,
							mode: details.agent,
							created: details.started,
							completed: event.created,
							finish: event.data.finish,
							cost: event.data.cost,
							tokens: event.data.tokens,
							output: [{
								role: "assistant",
								content: details.content
							}]
						});
						generationDetails.delete(event.data.assistantMessageID);
					}
					if (event.type === "session.step.failed") {
						langfuse.traceFailedGenerationStep({
							id: event.id,
							sessionID: event.data.sessionID,
							assistantMessageID: event.data.assistantMessageID,
							completed: event.created,
							error: event.data.error
						});
						generationDetails.delete(event.data.assistantMessageID);
					}
					if (event.type === "session.retry.scheduled") langfuse.traceEvent({
						id: event.id,
						sessionID: event.data.sessionID,
						name: "opencode.generation.retry",
						timestamp: event.created,
						output: event.data.error,
						metadata: { attempt: event.data.attempt }
					});
					if (event.type === "session.execution.failed") {
						langfuse.traceSessionError({
							sessionID: event.data.sessionID,
							error: {
								name: event.data.error.type,
								message: event.data.error.message
							}
						});
						for (const [messageID, details] of generationDetails) if (details.sessionID === event.data.sessionID) generationDetails.delete(messageID);
						await runPromise(langfuse.forceFlush);
					}
					if (event.type === "session.execution.succeeded" || event.type === "session.execution.interrupted") {
						langfuse.endActiveToolObservations(event.data.sessionID);
						langfuse.endActiveGenerationSteps(event.data.sessionID);
						langfuse.endActiveTurnObservations(event.data.sessionID);
						for (const [messageID, details] of generationDetails) if (details.sessionID === event.data.sessionID) generationDetails.delete(messageID);
						await runPromise(langfuse.forceFlush);
					}
					if (event.type === "session.deleted") langfuse.clearSessionTraceState(event.data.sessionID);
				}
			} catch (error) {
				if (!abort.signal.aborted) console.error(`Langfuse event subscription failed: ${String(error)}`);
			}
		})();
		return async () => {
			abort.abort();
			await Promise.all(registrations.map((registration) => registration.dispose()));
			await events;
			langfuse.endActiveToolObservations();
			langfuse.endActiveGenerationSteps();
			langfuse.endActiveTurnObservations();
			langfuse.clearTraceState();
			await runPromise(langfuse.forceFlush);
		};
	}
};
//#endregion
export { LangfusePlugin as default };

//# sourceMappingURL=index.js.map