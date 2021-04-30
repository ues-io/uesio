import { definition, builder, styles, signal } from "@uesio/ui"

type FileUploadDefinition = {
	id: string
	fieldId: string
	margin?: styles.MarginDefinition
	signals: signal.SignalDefinition[]
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
	],
	traits: ["uesio.standalone"],
}
export { FileUploadProps, FileUploadDefinition }

export default FileUploadPropertyDefinition
