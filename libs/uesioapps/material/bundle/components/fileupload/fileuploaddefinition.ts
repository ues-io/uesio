import { definition, builder, styles, signal } from "@uesio/ui"

type FileUploadDefinition = {
	id: string
	fieldId: string
	fileCollection: string
	margin?: styles.MarginDefinition
	signals?: signal.ComponentSignal[]
	wire: string
}

interface FileUploadProps extends definition.BaseProps {
	definition: FileUploadDefinition
}

const FileUploadPropertyDefinition: builder.BuildPropertiesDefinition = {
	title: "FileUpload ",
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
	],
	traits: ["uesio.standalone"],
}
export { FileUploadProps, FileUploadDefinition }

export default FileUploadPropertyDefinition
