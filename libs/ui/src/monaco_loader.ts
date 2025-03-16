/** this file demonstrates an example of how you should import the url/relative-paths of your monaco-workers.
 *
 * in the bundled code, the import statements made at the beginning will be replaced with string variables.
 *
 * for instance, the following import:
 * ```ts
 * import editorWorkerUrl from "monaco-editor/esm/vs/editor/editor.worker.js" with { type: "monaco-worker" }
 * ```
 *
 * will transform to the following relative-path string in the bundled code:
 * ```ts
 * var editorWorkerUrl = "./editor.worker-4DUWL7QZ.js"
 * ```
 *
 * and now, to resolve the `editorWorkerUrl` path relative to _this_ script's bundled form, as a full http url,
 * you will want to use `import.meta.resolve`:
 * ```ts
 * const editorWorkerFullUrl = import.meta.resolve(editorWorkerUrl)
 * const editorWorker = new Worker(editorWorkerFullUrl)
 * ```
 *
 * you may wonder if you can simply pass the relative-path of `editorWorkerUrl` to the `new Worker` constructor,
 * and the answer is **NO**, you can't do that.
 * that's because the worker constructor **MUST** always be provided with an absolute url,
 * otherwise it will fail and leave a cryptic error message on your console that is not easy to figure out.
 *
 * @module
*/

// @ts-ignore: requires esbuild with a custom plugin for loading
import editorWorkerUrl from "monaco-editor/esm/vs/editor/editor.worker.js" with { type: "monaco-worker" }
// @ts-ignore: requires esbuild with a custom plugin for loading
import cssWorkerUrl from "monaco-editor/esm/vs/language/css/css.worker.js" with { type: "monaco-worker" }
// @ts-ignore: requires esbuild with a custom plugin for loading
import htmlWorkerUrl from "monaco-editor/esm/vs/language/html/html.worker.js" with { type: "monaco-worker" }
// @ts-ignore: requires esbuild with a custom plugin for loading
import jsonWorkerUrl from "monaco-editor/esm/vs/language/json/json.worker.js" with { type: "monaco-worker" }
// @ts-ignore: requires esbuild with a custom plugin for loading
import tsWorkerUrl from "monaco-editor/esm/vs/language/typescript/ts.worker.js" with { type: "monaco-worker" }
// importing the monaco editor itself
//import { editor as monacoEditor, languages as monacoLanguages, type Environment } from "monaco-editor"
import * as monaco from "monaco-editor"
import { type Environment }  from "monaco-editor"
import { loader, Editor } from "@monaco-editor/react"

const global_context = globalThis as (typeof globalThis & { MonacoEnvironment?: Environment })
const monacoEnvironment: Environment = (global_context.MonacoEnvironment ??= {})
if (!monacoEnvironment.getWorkerUrl) {
	monacoEnvironment.getWorkerUrl = (worker_id: string, label: string) => (import.meta.resolve(editorWorkerUrl))
}
const original_getWorkerUrl = monacoEnvironment.getWorkerUrl!
monacoEnvironment.getWorkerUrl = (worker_id: string, label: string): string => {
	const subpath = workerSubpathResolver(worker_id, label)
	if (subpath) { return import.meta.resolve(subpath) }
	return original_getWorkerUrl(worker_id, label)
}

const workerSubpathResolver = (worker_id: string, label: string): string | undefined => {
	switch (label) {
		case "json":
			return jsonWorkerUrl
		case "css":
		case "scss":
		case "less":
			return cssWorkerUrl
		case "html":
		case "handlebars":
		case "razor":
			return htmlWorkerUrl
		case "typescript":
		case "javascript":
			return tsWorkerUrl
		default:
			return undefined
	}
}

export {
  monaco,
  loader,
  Editor
}

