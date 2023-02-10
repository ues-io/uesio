import { styles, api, definition } from "@uesio/ui"
import { default as IOCodeField } from "../../utilities/codefield/codefield"

type CodeFieldDefinition = {
	language?: CodeFieldLanguage
	label?: string
	file: string
}

type CodeFieldLanguage =
	| "yaml"
	| "json"
	| "javascript"
	| "typescript"
	| "html"
	| "css"

const CodeField: definition.UC<CodeFieldDefinition> = (props) => {
	const { definition, context } = props

	const classes = styles.useStyles(
		{
			root: {},
		},
		props
	)
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
/*
const CodePropertyDefinition: builder.BuildPropertiesDefinition = {
	title: "Code",
	description: "Code editor",
	link: "https://docs.ues.io/",
	defaultDefinition: () => ({}),
	properties: [
		{
			name: "language",
			type: "SELECT",
			label: "Language",
			options: [
				{
					value: "",
					label: "",
				},
				{
					value: "yaml",
					label: "yaml",
				},
				{
					value: "json",
					label: "json",
				},
				{
					value: "javascript",
					label: "javascript",
				},
				{
					value: "typescript",
					label: "typescript",
				},
				{
					value: "html",
					label: "html",
				},
				{
					value: "css",
					label: "css",
				},
			],
		},
		{
			name: "label",
			type: "TEXT",
			label: "label",
		},
		{
			name: "file",
			type: "METADATA",
			metadataType: "FILE",
			label: "File",
		},
	],
	sections: [],
	actions: [],
	//traits: ["uesio.standalone"],
	type: "component",
	classes: ["root"],
} */

export default CodeField
