import { FC } from "react"
import { definition, collection, component, wire } from "@uesio/ui"

const FileImage = component.registry.getUtility("uesio/io.fileimage")
const FileText = component.registry.getUtility("uesio/io.filetext")
const File = component.registry.getUtility("uesio/io.file")

interface FilePreviewProps extends definition.UtilityProps {
	fieldMetadata: collection.Field
	record: wire.WireRecord
}

const FilePreview: FC<FilePreviewProps> = (props) => {
	const { fieldMetadata, record } = props
	const fieldId = fieldMetadata.getId()
	const userFile = record.getFieldValue<wire.PlainWireRecord | undefined>(
		fieldId
	)
	const mimeType = userFile?.["uesio/core.mimetype"] as string
	if (!mimeType) return <File {...props} />

	const mime = mimeType.slice(0, mimeType.indexOf("/"))
	switch (mime) {
		case "text":
			return <FileText {...props} />
		case "application":
			return <FileText {...props} />
		case "image":
			return <FileImage {...props} />
		default:
			return null
	}
}

export default FilePreview
