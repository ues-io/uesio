import { definition, context, api, collection, signal } from "@uesio/ui"
import File from "../../utilities/file/file"
import FileImage from "../../utilities/fileimage/fileimage"
import FilePreview from "../../utilities/filepreview/filepreview"
import FileText from "../../utilities/filetext/filetext"
import FileVideo from "../../utilities/filevideo/filevideo"
import { fileTextSignals, UserFileMetadata } from "../field/field"

type FileDefinition = {
	id?: string
	displayAs?: string
	accept?: string
	mode?: context.FieldMode
	// The language to use for syntax highlighting
	language?: string
	// The Monaco editor theme to use
	theme?: string
	// An array of URIs which contain ambient type definitions to load in this code field
	typeDefinitionFileURIs?: string[]
	// Signals to run after a file is uploaded
	onUploadSignals?: signal.SignalDefinition[]
	// Signals to run after a file is deleted
	onDeleteSignals?: signal.SignalDefinition[]
}

const FileAttachment: definition.UC<FileDefinition> = (props) => {
	const { context, definition, path } = props
	const {
		accept,
		displayAs,
		mode = context.getFieldMode(),
		onUploadSignals,
		onDeleteSignals,
		theme,
		typeDefinitionFileURIs,
	} = definition
	const language = definition.language
		? context.mergeString(definition.language)?.toLowerCase()
		: undefined
	const id = api.component.getComponentIdFromProps(props)

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
		const uploadResult = await api.file.uploadFile(
			context,
			{
				collectionID: collectionId,
				recordID: recordId,
				params: context.getParams(),
			},
			file
		)
		record.setAll(uploadResult)
		if (onUploadSignals) {
			await api.signal.getHandler(
				onUploadSignals,
				context.addComponentFrame(props.componentType as string, {
					file: uploadResult,
				})
			)?.()
		}
		return uploadResult
	}

	const onDelete = async () => {
		if (!userFileId) return
		const deleteResult = await api.file.deleteFile(context, userFileId)
		if (onDeleteSignals) {
			await api.signal.getHandler(
				onDeleteSignals,
				context.addComponentFrame(props.componentType as string, {
					deleteResult,
				})
			)?.()
		}
		return deleteResult
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
			return (
				<FileText
					{...common}
					language={language}
					typeDefinitionFileURIs={typeDefinitionFileURIs}
					theme={theme}
				/>
			)
		case "IMAGE":
			return <FileImage accept={accept} {...common} />
		case "VIDEO":
			return <FileVideo accept={accept} {...common} />
		case "PREVIEW":
			return <FilePreview accept={accept} {...common} />
		default:
			return <File accept={accept} {...common} />
	}
}

FileAttachment.signals = fileTextSignals

export default FileAttachment
