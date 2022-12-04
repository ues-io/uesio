import { FC } from "react"
import { definition, collection, component, wire } from "@uesio/ui"

const FileVideo = component.getUtility("uesio/io.filevideo")
const FileImage = component.getUtility("uesio/io.fileimage")
const FileText = component.getUtility("uesio/io.filetext")
const File = component.getUtility("uesio/io.file")
const FileMarkDown = component.getUtility("uesio/io.filemarkdown")

interface FilePreviewProps extends definition.UtilityProps {
	fieldMetadata: collection.Field
	fieldId: string
	record: wire.WireRecord
}

const FilePreview: FC<FilePreviewProps> = (props) => {
	const { fieldId, record } = props

	const userFile = record.getFieldValue<wire.PlainWireRecord>(fieldId)
	const mimeType = userFile?.["uesio/core.mimetype"] as string
	if (!mimeType) return <File {...props} />

	const mime = mimeType.slice(0, mimeType.indexOf("/"))
	const subMime = mimeType.slice(
		mimeType.indexOf("/") + 1,
		mimeType.indexOf(";")
	)

	switch (mime) {
		case "text":
			switch (subMime) {
				case "markdown":
					return <FileMarkDown {...props} />
			}
			return <FileText {...props} />
		case "application":
			return <File {...props} />
		case "image":
			return <FileImage {...props} />
		case "video":
			return <FileVideo {...props} />
		default:
			return <File {...props} />
	}
}

export default FilePreview
