import { createHighlighterCore } from "shiki/core"
import { createJavaScriptRegexEngine } from "shiki/engine/javascript"

export type HighlightTheme = "light-plus" | "dark-plus"
export const highlightThemeDefault: HighlightTheme = "light-plus"
// By default, shiki uses Oniguruma Engine (https://shiki.matsu.io/guide/regex-engines#oniguruma-engine)
// but to reduce bundle size, we use Javascript Engine (https://shiki.matsu.io/guide/regex-engines#javascript-regexp-engine).
// To reduce start-up time, the Raw javascript engine could be used but it currently has two limitations:
//    1. Requires RegExp UnicodeSets (ES2024 feature) - This should not be an issue for us as browsers we target support this https://caniuse.com/mdn-javascript_builtins_regexp_unicodesets
//    2. Known Shiki Issue - https://github.com/shikijs/shiki/issues/918
// TODO: If/When https://github.com/shikijs/shiki/issues/918 is resolved, we could move to Javascript Raw Engine
// and pre-compiled languages since the browsers we target support RegExp UnicodeSets.
const highlighter = await createHighlighterCore({
  themes: [
    import("@shikijs/themes/light-plus"),
    import("@shikijs/themes/dark-plus"),
  ],
  langs: [
    import("@shikijs/langs/javascript"),
    import("@shikijs/langs/typescript"),
    import("@shikijs/langs/yaml"),
    import("@shikijs/langs/html"),
    import("@shikijs/langs/json"),
    import("@shikijs/langs/css"),
  ],
  engine: createJavaScriptRegexEngine(),
})

export { highlighter }
