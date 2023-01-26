import { FC } from "react"
import { definition, context } from "@uesio/ui"
import FileMarkDown from "../filemarkdown/filemarkdown"
import File from "../file/file"
import FileText from "../filetext/filetext"
import FileImage from "../fileimage/fileimage"
import FileVideo from "../filevideo/filevideo"
import { UserFileMetadata } from "../../components/field/field"

interface FilePreviewProps extends definition.UtilityProps {
	path: string
	id?: string
	mode?: context.FieldMode
	userFile?: UserFileMetadata
	onUpload: (files: FileList | null) => void
	onDelete?: () => void
	accept?: string
}

const FilePreview: FC<FilePreviewProps> = (props) => {
	const { userFile } = props
	const mimeType = userFile?.["uesio/core.mimetype"]
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
