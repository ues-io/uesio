import { definition, styles, api } from "@uesio/ui"
import Editor, { loader, Monaco, useMonaco } from "@monaco-editor/react"
import type monaco from "monaco-editor"
import { CodeFieldUtilityProps } from "./types"
import { useEffect, useState } from "react"

const staticAssetPath = api.platform.getStaticAssetsPath()
const { useAsync } = api.component

loader.config({
	paths: { vs: staticAssetPath + "/static/vendor/monaco-editor/min/vs" },
})

const preprocessTypeFileURIs = (uris: string[] | undefined) => {
	if (uris === undefined) return []
	return uris.map((uri) =>
		uri.startsWith("/static") ? staticAssetPath + uri : uri
	)
}

const CodeField: definition.UtilityComponent<CodeFieldUtilityProps> = (
	props
) => {
	const { setValue, value, language, options, onMount } = props
	const typeDefinitionFileURIs = preprocessTypeFileURIs(
		props.typeDefinitionFileURIs
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

	const fileLoads = typeDefinitionFileURIs.map((uri: string) => ({
		uri,
		...useAsync({
			cacheKey: `fetch-file-as-text-${uri}`,
		}),
	}))

	useEffect(() => {
		const fetchFile = async (uri: string) => {
			const result = await fetch(uri)
			if (result.status !== 200) {
				throw new Error(
					"Failed to load resource: " +
						uri +
						", result: " +
						result.statusText
				)
			}

			return await result.text()
		}

		fileLoads.forEach(({ run, uri }) => {
			run(() => fetchFile(uri)).then(({ data, loading, error }) => {
				if (data && !loading && !error) {
					setLoadedModels({
						...loadedModels,
						[uri]: data as string,
					})
				}
			})
		})
	}, [props.typeDefinitionFileURIs, JSON.stringify(loadedModels)])

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

	if (!monacoApi) return null

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
				language={language || "typescript"}
				onChange={setValue}
				beforeMount={handleEditorWillMount}
				onMount={handleEditorDidMount}
			/>
		</div>
	)
}

export default CodeField
