import { definition, styles, context, api } from "@uesio/ui"
import Editor, { EditorProps, loader, OnChange } from "@monaco-editor/react"
import type monaco from "monaco-editor"

interface CodeFieldUtilityProps {
	setValue: OnChange
	value: string
	language?: string
	mode?: context.FieldMode
	options?: monaco.editor.IStandaloneEditorConstructionOptions
	onMount?: EditorProps["onMount"]
}

const staticAssetPath = api.platform.getStaticAssetsPath()

loader.config({
	paths: { vs: staticAssetPath + "/static/vendor/monaco-editor/min/vs" },
})

const CodeField: definition.UtilityComponent<CodeFieldUtilityProps> = (
	props
) => {
	const { setValue, value, language, options, onMount } = props
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
				language={language || "javascript"}
				onChange={setValue}
				onMount={onMount}
			/>
		</div>
	)
}

export default CodeField
