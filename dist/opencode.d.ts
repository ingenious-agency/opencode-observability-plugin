import type { PluginInput } from "@opencode-ai/plugin";
import { Context as EffectContext } from "effect";
export type OpencodeClient = Pick<PluginInput["client"], "app" | "tool" | "session">;
declare const OpencodeClientService_base: EffectContext.TagClass<OpencodeClientService, "OpencodeClientService", OpencodeClient>;
export declare class OpencodeClientService extends OpencodeClientService_base {
}
export {};
//# sourceMappingURL=opencode.d.ts.map