import { FunctionComponent } from "react"
import { definition, wire, api, collection } from "@uesio/ui"
import UploadArea from "../uploadarea/uploadarea"

interface FileUploadAreaProps extends definition.UtilityProps {
	accept?: string
	record: wire.WireRecord
	wire: wire.Wire
	fieldId: string
	uploadLabelId?: string
	deleteLabelId?: string
}

const FileUploadArea: FunctionComponent<FileUploadAreaProps> = (props) => {
	const { context, record, wire, fieldId } = props

	const userFile = record.getFieldValue<wire.PlainWireRecord>(fieldId)

	const userFileId = userFile?.[collection.ID_FIELD] as string

	const upload = async (files: FileList | null) => {
		if (files && files.length > 0) {
			const collectionFullName = wire.getCollection().getFullName()
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

	const deleteFile = async () => {
		await api.file.deleteFile(context, userFileId)
		record.set(fieldId, "")
	}

	return (
		<UploadArea
			onUpload={upload}
			onDelete={deleteFile}
			context={context}
			accept={props.accept}
			className={props.className}
			uploadLabelId={props.uploadLabelId}
			deleteLabelId={props.deleteLabelId}
		>
			{props.children}
		</UploadArea>
	)
}

export default FileUploadArea
