import { definition, builder, styles, signal } from "@uesio/ui"

type FileDefinition = {
	id: string
	fieldId: string
	fileCollection: string
	displayAs: "button" | "file" | "preview"
	margin?: styles.MarginDefinition
	width?: number
	height?: number
	signals?: signal.SignalDefinition[]
}

interface FileProps extends definition.BaseProps {
	definition: FileDefinition
}

const FilePropertyDefinition: builder.BuildPropertiesDefinition = {
	title: "File ",
	defaultDefinition: () => ({}),
	sections: [],
	properties: [
		{
			name: "fieldId",
			type: "TEXT",
			label: "Source",
		},
		{
			name: "fileCollection",
			type: "TEXT",
			label: "File Collection",
		},
		{
			name: "displayAs",
			type: "SELECT",
			label: "Display As",
			options: [
				{
					value: "file",
					label: "File",
				},
				{
					value: "button",
					label: "Button",
				},
				{
					value: "preview",
					label: "Preview",
				},
			],
		},
		{
			name: "width",
			type: "NUMBER",
			label: "Width",
		},
		{
			name: "height",
			type: "NUMBER",
			label: "Height",
		},
	],
	traits: ["uesio.standalone"],
}
export { FileProps, FileDefinition }

export default FilePropertyDefinition
