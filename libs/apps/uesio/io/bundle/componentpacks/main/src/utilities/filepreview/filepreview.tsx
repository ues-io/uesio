import { FC } from "react"
import { definition, collection, wire } from "@uesio/ui"
import FileMarkDown from "../filemarkdown/filemarkdown"
import File from "../file/file"
import FileText from "../filetext/filetext"
import FileImage from "../fileimage/fileimage"
import FileVideo from "../filevideo/filevideo"

interface FilePreviewProps extends definition.UtilityProps {
	fieldMetadata: collection.Field
	fieldId: string
	record: wire.WireRecord
	wire: wire.Wire
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
