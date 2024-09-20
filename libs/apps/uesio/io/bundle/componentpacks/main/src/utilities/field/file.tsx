import { definition, context, wire, styles } from "@uesio/ui"
import {
	MarkdownFieldOptions,
	UserFileMetadata,
} from "../../components/field/field"
import UserFile from "../userfile/userfile"

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
		value,
		record,
		fieldId,
	} = props

	const classes = styles.useUtilityStyleTokens(StyleDefaults, props)

	if (record.isNew())
		return (
			<div className={classes.messagearea}>
				<div>Must save record before uploading a file.</div>
			</div>
		)

	const userFile = value as UserFileMetadata | undefined
	const recordId = record.getIdFieldValue() || ""
	const collectionId = record.getWire().getCollection().getFullName()

	return (
		<UserFile
			id={id}
			displayAs={displayAs}
			userFile={userFile}
			context={context}
			onUpload={async (response) => {
				record.set(fieldId, response)
			}}
			onDelete={async () => {
				record.set(fieldId, "")
			}}
			mode={mode}
			textOptions={{
				markdownOptions,
			}}
			recordId={recordId}
			collectionId={collectionId}
			fieldId={fieldId}
		/>
	)
}

export default FileField
