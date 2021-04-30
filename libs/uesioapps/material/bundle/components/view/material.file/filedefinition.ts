import { definition, builder, styles, signal } from "@uesio/ui"

type FileDefinition = {
	id: string
	fieldId: string
	editable: boolean
	displayAs: "button" | "preview" | "fullPreview"
	accepts: "images" | "all"
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
			name: "editable",
			type: "BOOLEAN",
			label: "Editable",
			displaytype: "switch",
		},
		{
			name: "displayAs",
			type: "SELECT",
			label: "Display As",
			options: [
				{
					value: "button",
					label: "Button",
				},
				{
					value: "preview",
					label: "Preview",
				},
				{
					value: "fullPreview",
					label: "Full preview",
				},
			],
		},
		{
			name: "accepts",
			type: "SELECT",
			label: "Accepts",
			options: [
				{
					value: "images",
					label: "Images",
				},
				{
					value: "all",
					label: "All",
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
