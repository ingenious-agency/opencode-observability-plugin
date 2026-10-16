import type { Plugin } from "@opencode/plugin";
declare const LangfusePlugin: {
    id: string;
    setup(ctx: Plugin.Context): Promise<(() => Promise<void>) | undefined>;
};
export default LangfusePlugin;
//# sourceMappingURL=v2.d.ts.map