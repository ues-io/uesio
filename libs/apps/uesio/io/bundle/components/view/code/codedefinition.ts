import { definition, builder } from "@uesio/ui"

type CodeFieldDefinition = {
	language?: CodeFieldLanguage
	label?: string
	file: string
}

type CodeFieldLanguage = "yaml" | "json" | "javascript" | "html" | "css"

interface CodeProps extends definition.BaseProps {
	definition: CodeFieldDefinition
}

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
}
export { CodeProps, CodeFieldDefinition }

export default CodePropertyDefinition
