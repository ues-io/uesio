import { FC } from "react"
import { definition, collection, component, wire } from "@uesio/ui"

const FileUpload = component.registry.getUtility("io.fileupload")
const FileText = component.registry.getUtility("io.filetext")

interface FileDynamicProps extends definition.UtilityProps {
	fieldMetadata: collection.Field
	record: wire.WireRecord
}

const FileDynamic: FC<FileDynamicProps> = (props) => {
	const { fieldMetadata, record } = props
	const fieldId = fieldMetadata.getId()
	const userFile = record.getFieldReference(fieldId)
	const mimeType = userFile?.["uesio.mimetype"] as string

	if (!mimeType) return <FileUpload {...props} />

	const mime = mimeType.slice(0, mimeType.indexOf("/"))

	switch (mime) {
		case "text":
			return <FileText {...props} />
		case "application":
			return <FileText {...props} />
		case "image":
			return <FileUpload {...props} />
		default:
			return null
	}
}

export default FileDynamic
