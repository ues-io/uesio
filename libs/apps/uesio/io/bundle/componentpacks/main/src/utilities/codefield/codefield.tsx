import { component, definition, styles, api, context } from "@uesio/ui"
import Editor, { loader, Monaco, useMonaco } from "@monaco-editor/react"
import type monaco from "monaco-editor"
import { CodeFieldUtilityProps } from "./types"
import { useState } from "react"
import { useDeepCompareEffect } from "react-use"
const { ErrorMessage } = component

const monacoEditorVersion = api.platform.getMonacoEditorVersion()
const staticAssetsHost = api.platform.getStaticAssetsHost()
const { memoizedAsync } = api.platform

loader.config({
	paths: {
		vs: `${staticAssetsHost}/static/vendor/monaco-editor/${monacoEditorVersion}/min/vs`,
	},
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

const StyleDefaults = Object.freeze({
	input: [],
	readonly: [],
})

const CodeField: definition.UtilityComponent<CodeFieldUtilityProps> = (
	props
) => {
	const {
		setValue,
		value,
		language = "typescript",
		options,
		onMount,
		context,
		theme,
		mode,
	} = props
	const [loading, setLoading] = useState(true)
	const [loadingError, setLoadingError] = useState("")
	const typeDefinitionFileURIs = preprocessTypeFileURIs(
		props.typeDefinitionFileURIs,
		context
	)
	const classes = styles.useUtilityStyleTokens(
		StyleDefaults,
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

	if (loading || !monacoApi) {
		return <div>Loading language models for {language}...</div>
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
					readOnly: mode === "READ",
					minimap: {
						enabled: false,
					},
					...options,
				}}
				theme={theme}
				language={language}
				onChange={setValue}
				beforeMount={handleEditorWillMount}
				onMount={handleEditorDidMount}
			/>
		</div>
	)
}

export default CodeField
