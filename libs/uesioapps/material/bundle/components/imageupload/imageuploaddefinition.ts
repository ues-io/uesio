import { definition, builder, styles, signal } from "@uesio/ui"

type ImageUploadDefinition = {
	id: string
	fieldId: string
	fileCollection: string
	preview: boolean
	margin?: styles.MarginDefinition
	width?: number
	height?: number
	signals?: signal.SignalDefinition[]
}

interface ImageUploadProps extends definition.BaseProps {
	definition: ImageUploadDefinition
}

const ImageUploadPropertyDefinition: builder.BuildPropertiesDefinition = {
	title: "ImageUpload ",
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
export { ImageUploadProps, ImageUploadDefinition }

export default ImageUploadPropertyDefinition
