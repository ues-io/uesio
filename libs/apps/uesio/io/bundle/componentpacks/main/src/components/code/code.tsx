import { styles, api, definition } from "@uesio/ui"
import { default as IOCodeField } from "../../utilities/codefield/codefield"

type CodeFieldDefinition = {
	language?: CodeFieldLanguage
	file: string
}

type CodeFieldLanguage =
	| "yaml"
	| "json"
	| "javascript"
	| "typescript"
	| "html"
	| "css"

const StyleDefaults = Object.freeze({
	root: [],
})

const CodeField: definition.UC<CodeFieldDefinition> = (props) => {
	const { definition, context } = props

	const classes = styles.useStyleTokens(StyleDefaults, props)
	const language = definition?.language || "yaml"
	const fileContent = api.file.useFile(context, definition.file)

	return (
		<IOCodeField
			classes={classes}
			value={fileContent || ""}
			setValue={(value: string) => {
				console.log(value)
			}}
			language={language}
			context={context}
			options={{
				lineNumbersMinChars: 0,
			}}
		/>
	)
}

export default CodeField
