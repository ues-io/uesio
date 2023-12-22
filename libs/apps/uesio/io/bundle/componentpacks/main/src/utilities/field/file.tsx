import { definition, context, wire, api, collection, styles } from "@uesio/ui"
import FileText from "../filetext/filetext"
import FileImage from "../fileimage/fileimage"
import FileVideo from "../filevideo/filevideo"
import FilePreview from "../filepreview/filepreview"
import File from "../file/file"
import {
	MarkdownFieldOptions,
	UserFileMetadata,
} from "../../components/field/field"

interface FileUtilityProps {
	path: string
	width?: string
	fieldId: string
	value: wire.FieldValue
	id?: string
	mode?: context.FieldMode
	record: wire.WireRecord
	displayAs?: string
	markdownOptions?: MarkdownFieldOptions
}

const StyleDefaults = Object.freeze({
	messagearea: [
		"border(& dashed slate-200)",
		"rounded-lg",
		"p-10",
		"text-xs",
		"text-slate-400",
		"align-center",
		"cursor-no-drop",
	],
})

const FileField: definition.UtilityComponent<FileUtilityProps> = (props) => {
	const {
		displayAs,
		context,
		markdownOptions,
		mode,
		id,
		variant,
		value,
		record,
		fieldId,
		path,
	} = props

	const classes = styles.useUtilityStyleTokens(StyleDefaults, props)

	if (record.isNew())
		return (
			<div className={classes.messagearea}>
				<div>Must save record before uploading a file.</div>
			</div>
		)

	const userFile = value as UserFileMetadata | undefined
	const userFileId = userFile?.[collection.ID_FIELD]

	const onUpload = async (file: FileList | File | null) => {
		if (!file) return
		if (file instanceof FileList) {
			if (file.length === 0) return
			file = file[0]
		}

		const collectionFullName = record
			.getWire()
			.getCollection()
			.getFullName()
		const recordId = record.getIdFieldValue() || ""

		const fileResponse = await api.file.uploadFile(
			context,
			{
				collectionID: collectionFullName,
				recordID: recordId,
				fieldID: fieldId,
				params: context.getParams(),
			},
			file
		)

		record.set(fieldId, fileResponse)
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
		displayAs,
	}

	switch (displayAs) {
		case "TEXT":
		case "MARKDOWN":
			return <FileText {...common} markdownOptions={markdownOptions} />
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

export default FileField
