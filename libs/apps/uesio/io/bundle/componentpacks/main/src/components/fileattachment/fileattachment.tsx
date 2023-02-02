import { definition, context, api, collection, signal } from "@uesio/ui"
import File from "../../utilities/file/file"
import FileImage from "../../utilities/fileimage/fileimage"
import FilePreview from "../../utilities/filepreview/filepreview"
import FileText from "../../utilities/filetext/filetext"
import FileVideo from "../../utilities/filevideo/filevideo"
import { UserFileMetadata } from "../field/field"

type FileDefinition = {
	id?: string
	displayAs?: string
	mode?: context.FieldMode
}

const signals: Record<string, signal.ComponentSignalDescriptor> = {
	UPLOAD_FILE: {
		dispatcher: (state) => {
			api.event.publish("upload")
			return state
		},
		label: "Upload File",
		properties: () => [],
	},
	CANCEL_FILE: {
		dispatcher: (state) => {
			api.event.publish("cancel")
			return state
		},
		label: "Cancel File",
		properties: () => [],
	},
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

	const onUpload = async (file: FileList | File | null) => {
		if (!file) return
		if (file instanceof FileList) {
			if (file.length === 0) return
			file = file[0]
		}
		const recordId = userFile?.["uesio/core.recordid"]
		const collectionId = userFile?.["uesio/core.collectionid"]
		if (!recordId || !collectionId) return
		await api.file.uploadFile(context, file, collectionId, recordId)
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
		case "MARKDOWN":
			return <FileText {...common} />
		case "IMAGE":
			return <FileImage {...common} />
		case "VIDEO":
			return <FileVideo {...common} />
		case "PREVIEW":
			return <FilePreview {...common} />
		default:
			return <File {...common} />
	}
}

FileAttachment.signals = signals

export default FileAttachment
