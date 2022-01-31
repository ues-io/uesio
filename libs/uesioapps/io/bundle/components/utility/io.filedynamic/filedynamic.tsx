import { FC } from "react"
import { definition, collection, component, wire } from "@uesio/ui"

const FileUpload = component.registry.getUtility("io.fileupload")
const FileText = component.registry.getUtility("io.filetext")
const FileButton = component.registry.getUtility("io.filebutton")

interface FileDynamicProps extends definition.UtilityProps {
	fieldMetadata: collection.Field
	record: wire.WireRecord
}

const FileDynamic: FC<FileDynamicProps> = (props) => {
	const { fieldMetadata, record } = props
	const fieldId = fieldMetadata.getId()
	const userFile = record.getFieldValue<wire.PlainWireRecord | undefined>(
		fieldId
	)
	const mimeType = userFile?.["uesio.mimetype"] as string
	if (!mimeType) return <FileUpload {...props} />

	const mime = mimeType.slice(0, mimeType.indexOf("/"))
	const mimeSubType = mimeType.slice(
		mimeType.indexOf("/") + 1,
		mimeType.indexOf(";")
	)
	switch (mime) {
		case "text":
			if (mimeSubType === "csv") return <FileButton {...props} />
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
