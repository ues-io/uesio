import { definition, context, wire, api, collection } from "@uesio/ui"
import FileText from "../filetext/filetext"
import FileImage from "../fileimage/fileimage"
import FileVideo from "../filevideo/filevideo"
import FilePreview from "../filepreview/filepreview"
import FileMarkDown from "../filemarkdown/filemarkdown"
import File from "../file/file"
import { UserFileMetadata } from "../../components/field/field"

interface FileUtilityProps {
	path: string
	width?: string
	fieldId: string
	value: wire.FieldValue
	id?: string
	mode?: context.FieldMode
	record: wire.WireRecord
	displayAs?: string
}

const FileField: definition.UtilityComponent<FileUtilityProps> = (props) => {
	const {
		displayAs,
		context,
		mode,
		id,
		variant,
		value,
		record,
		fieldId,
		path,
	} = props

	const userFile = value as UserFileMetadata | undefined
	const userFileId = userFile?.[collection.ID_FIELD]

	const onUpload = async (files: FileList | null) => {
		if (files && files.length > 0) {
			const collectionFullName = record
				.getWire()
				.getCollection()
				.getFullName()
			const recordId = record.getIdFieldValue() || ""
			const file = files[0]
			const fileResponse = await api.file.uploadFile(
				context,
				file,
				collectionFullName,
				recordId,
				fieldId
			)

			record.set(fieldId, fileResponse)
		}
	}

	const onDelete = async () => {
		if (!userFileId) return
		await api.file.deleteFile(context, userFileId)
		record.set(fieldId, "")
	}

	const common = {
		path,
		context,
		mode,
		id,
		userFile,
		variant,
		onUpload,
		onDelete,
	}

	switch (displayAs) {
		case "TEXT":
			return <FileText {...common} />
		case "IMAGE":
			return <FileImage {...common} />
		case "VIDEO":
			return <FileVideo {...common} />
		case "PREVIEW":
			return <FilePreview {...common} />
		case "MARKDOWN":
			return <FileMarkDown {...common} />
		default:
			return <File {...common} />
	}
}

export default FileField
