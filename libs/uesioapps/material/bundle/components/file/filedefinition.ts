import { definition, builder, styles, signal } from "@uesio/ui"

type FileDefinition = {
	id: string
	fieldId: string
	fileCollection: string
	preview: boolean
	margin?: styles.MarginDefinition
	width?: number
	height?: number
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
			name: "preview",
			type: "BOOLEAN",
			label: "Preview",
			displaytype: "switch",
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
