import { definition, context, api, collection } from "@uesio/ui"
import File from "../../utilities/file/file"
import FileImage from "../../utilities/fileimage/fileimage"
import FileMarkDown from "../../utilities/filemarkdown/filemarkdown"
import FilePreview from "../../utilities/filepreview/filepreview"
import FileText from "../../utilities/filetext/filetext"
import FileVideo from "../../utilities/filevideo/filevideo"
import { UserFileMetadata } from "../field/field"

type FileDefinition = {
	id?: string
	displayAs?: string
	mode?: context.FieldMode
}

const FileAttachment: definition.UC<FileDefinition> = (props) => {
	const { context, definition, path } = props
	const { id, displayAs, mode } = definition

	const record = context.getRecord()

	// If we don't have a record in context, bail
	if (!record) return null

	const collectionName = record.getWire().getCollection().getFullName()

	if (collectionName !== "uesio/core.userfile")
		throw new Error(
			"Wrong Record Type In Context: " +
				collectionName +
				" Expecting a userfile"
		)

	const userFile = record.source as UserFileMetadata
	const userFileId = userFile?.[collection.ID_FIELD]

	const onUpload = async (files: FileList | null) => {
		const recordId = userFile?.["uesio/core.recordid"]
		const collectionId = userFile?.["uesio/core.collectionid"]
		if (!recordId || !collectionId) return
		if (files && files.length > 0) {
			const file = files[0]
			await api.file.uploadFile(context, file, collectionId, recordId)
		}
	}

	const onDelete = async () => {
		if (!userFileId) return
		await api.file.deleteFile(context, userFileId)
	}

	// Right now this only works if a file record is in context
	const common = {
		path,
		context,
		mode,
		id,
		userFile,
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

export default FileAttachment
