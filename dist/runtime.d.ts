import { Effect, type SynchronizedRef as SynchronizedRefType } from "effect";
import { type LangfuseClient } from "./langfuse.js";
declare const MissingLangfuseCredentials_base: new <A extends Record<string, any> = {}>(args: import("effect/Types").VoidIfEmpty<{ readonly [P in keyof A as P extends "_tag" ? never : P]: A[P]; }>) => import("effect/Cause").YieldableError & {
    readonly _tag: "MissingLangfuseCredentials";
} & Readonly<A>;
declare class MissingLangfuseCredentials extends MissingLangfuseCredentials_base<{
    readonly message: string;
}> {
}
declare const ChangedLangfuseConfiguration_base: new <A extends Record<string, any> = {}>(args: import("effect/Types").VoidIfEmpty<{ readonly [P in keyof A as P extends "_tag" ? never : P]: A[P]; }>) => import("effect/Cause").YieldableError & {
    readonly _tag: "ChangedLangfuseConfiguration";
} & Readonly<A>;
declare class ChangedLangfuseConfiguration extends ChangedLangfuseConfiguration_base<{
    readonly message: string;
}> {
}
/**
 * opencode disposes and re-creates plugin instances inside the same process
 * (e.g. when the effective config changes) while the OTel tracer provider is
 * registered process-wide and cannot be registered a second time. Spans are
 * exported by that first provider, so a re-created instance has to keep using
 * the client that owns it: flushing or shutting down a second provider would
 * silently drop the session.
 *
 * Symbol.for keeps the owner stable if the package is loaded more than once.
 */
type SharedClientState = {
    readonly _tag: "Empty";
} | {
    readonly _tag: "Ready";
    readonly client: LangfuseClient;
    readonly key: string;
};
declare global {
    var langfuseOpencodeRuntimeState: SynchronizedRefType.SynchronizedRef<SharedClientState> | undefined;
}
export declare const createLangfuseRuntime: (input: {
    opencodeVersion?: string;
}) => Effect.Effect<LangfuseClient, MissingLangfuseCredentials | ChangedLangfuseConfiguration, never>;
export {};
//# sourceMappingURL=runtime.d.ts.map