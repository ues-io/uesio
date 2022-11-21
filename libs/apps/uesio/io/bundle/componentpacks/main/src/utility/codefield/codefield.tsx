import { FunctionComponent } from "react"
import { definition, styles, context } from "@uesio/ui"
import Editor, { EditorProps, loader, OnChange } from "@monaco-editor/react"
import type monaco from "monaco-editor"

interface CodeFieldUtilityProps extends definition.UtilityProps {
	setValue: OnChange
	value: string
	language?: string
	mode?: context.FieldMode
	options?: monaco.editor.IStandaloneEditorConstructionOptions
	onMount?: EditorProps["onMount"]
}

loader.config({ paths: { vs: "/static/vendor/monaco-editor/min/vs" } })

const CodeField: FunctionComponent<CodeFieldUtilityProps> = (props) => {
	const { setValue, value, language, options, onMount } = props
	const classes = styles.useUtilityStyles(
		{
			input: {
				height: "320px",
			},
			readonly: {},
		},
		props
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

export { CodeFieldUtilityProps }

export default CodeField
