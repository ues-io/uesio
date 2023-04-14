import { component, definition, styles, api, context } from "@uesio/ui"
import Editor, { loader, Monaco, useMonaco } from "@monaco-editor/react"
import type monaco from "monaco-editor"
import { CodeFieldUtilityProps } from "./types"
import { useState } from "react"
import { useDeepCompareEffect } from "react-use"
const { ErrorMessage } = component

const staticAssetPath = api.platform.getStaticAssetsPath()
const { memoizedAsync } = api.platform

loader.config({
	paths: { vs: staticAssetPath + "/static/vendor/monaco-editor/min/vs" },
})

const preprocessTypeFileURIs = (
	uris: string[] | undefined,
	context: context.Context
) => {
	if (uris === undefined) return []
	return uris.map((uri) => context.mergeString(uri))
}

const fetchFile = async (uri: string) => {
	const result = await fetch(uri, {
		headers: {
			Accept: "text/plain",
		},
	})
	if (result.status >= 400) {
		throw new Error(
			"Failed to load file from URL: " +
				uri +
				(result.statusText ? ", result: " + result.statusText : "")
		)
	}
	return await result.text()
}

// Not able to export this from platform for some reason, so redefining here
type AsyncResult = {
	data?: string
	error?: string
	loading: boolean
}

const CodeField: definition.UtilityComponent<CodeFieldUtilityProps> = (
	props
) => {
	const { setValue, value, language, options, onMount, context } = props
	const [loading, setLoading] = useState(true)
	const [loadingError, setLoadingError] = useState("")
	const typeDefinitionFileURIs = preprocessTypeFileURIs(
		props.typeDefinitionFileURIs,
		context
	)
	const classes = styles.useUtilityStyles(
		{
			input: {
				height: "320px",
			},
			readonly: {},
		},
		props,
		"uesio/io.codefield"
	)

	const [loadedModels, setLoadedModels] = useState(
		{} as Record<string, string>
	)

	useDeepCompareEffect(() => {
		;(async () => {
			try {
				await Promise.all(
					typeDefinitionFileURIs.map((uri) =>
						memoizedAsync(() => fetchFile(uri), {
							cacheKey: `fetch-file-as-text-${uri}`,
							timeout: 5000,
						}).then((result: AsyncResult) => {
							const { data } = result
							setLoadedModels({
								...loadedModels,
								[uri]: data as string,
							})
							return result
						})
					)
				)
			} catch (result) {
				const { error } = result as AsyncResult
				setLoadingError(error || "")
			} finally {
				setLoading(false)
			}
		})()
		return
	}, [typeDefinitionFileURIs, loadedModels])

	function handleEditorWillMount(monaco: Monaco) {
		const loadedTypeModelUris = Object.keys(loadedModels)
		if (loadedTypeModelUris.length > 0) {
			loadedTypeModelUris.forEach((uri) => {
				const monacoUri = monaco.Uri.parse(uri)
				if (!monaco.editor.getModel(monacoUri)) {
					monaco.editor.createModel(
						loadedModels[uri],
						language,
						monacoUri
					)
				}
			})
		}
		monaco.languages.typescript.javascriptDefaults.setEagerModelSync(true)
	}

	function handleEditorDidMount(
		editor: monaco.editor.IStandaloneCodeEditor,
		monaco: Monaco
	) {
		onMount?.(editor, monaco)
	}

	const monacoApi = useMonaco()
	const languageModel = language || "typescript"

	if (loading || !monacoApi) {
		return <div>Loading language models for {languageModel}...</div>
	}

	if (!loading && loadingError) {
		return (
			<ErrorMessage
				title="Code editor"
				error={
					new Error(
						`Failed to load language models for code editor, error is: ${loadingError}`
					)
				}
			/>
		)
	}

	return (
		<div className={classes.input}>
			<Editor
				value={value}
				options={{
					scrollBeyondLastLine: false,
					automaticLayout: true,
					minimap: {
						enabled: false,
					},
					...options,
				}}
				language={languageModel}
				onChange={setValue}
				beforeMount={handleEditorWillMount}
				onMount={handleEditorDidMount}
			/>
		</div>
	)
}

export default CodeField
