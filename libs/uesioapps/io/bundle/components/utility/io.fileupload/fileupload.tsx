import { FunctionComponent, DragEvent, useRef } from "react"
import {
	definition,
	styles,
	collection,
	component,
	context,
	wire,
	hooks,
} from "@uesio/ui"

interface FileUploadProps extends definition.UtilityProps {
	label?: string
	width?: string
	fieldMetadata: collection.Field
	hideLabel?: boolean
	id?: string
	mode?: context.FieldMode
	record: wire.WireRecord
	wire: wire.Wire
}

const Icon = component.registry.getUtility("io.icon")

const FileUpload: FunctionComponent<FileUploadProps> = (props) => {
	const uesio = hooks.useUesio(props)
	const { fieldMetadata, record, context, wire } = props
	const fieldId = fieldMetadata.getId()

	const fileInput = useRef<HTMLInputElement>(null)

	const userFile = record.getFieldValue(fieldId) as
		| wire.PlainWireRecord
		| undefined

	const userFileId = userFile?.["uesio.id"] as string
	const fileName = userFile?.["uesio.name"] as string
	const mimeType = userFile?.["uesio.mimetype"] as string
	const fileUrl = uesio.file.getUserFileURL(context, userFileId, true)

	const classes = styles.useUtilityStyles(
		{
			root: {
				position: "relative",
				maxWidth: "200px",
			},
			image: {
				width: "100%",
			},
			editicon: {
				display: "block",
				position: "absolute",
				top: "0",
				right: "0",
				cursor: "pointer",
				padding: "4px",
				margin: "4px",
				color: "white",
				backdropFilter: "brightness(0.6)",
				borderRadius: "4px",
			},
			fileinput: {
				display: "none",
			},
		},
		props
	)

	const upload = async (files: FileList | null) => {
		if (files && files.length > 0) {
			const collection = wire.getCollection()
			const collectionFullName = collection.getFullName()
			const recordId = record.getIdFieldValue() as string
			const file = files[0]
			const fileId = await uesio.file.uploadFile(
				uesio.getContext(),
				file,
				collectionFullName,
				recordId,
				fieldId
			)
			record.set(fieldId, fileId)
		}
	}

	const onDrop = (e: DragEvent) => {
		e.preventDefault()
		e.stopPropagation()
		upload(e.dataTransfer.files)
	}

	const onDragOver = (e: DragEvent) => {
		e.preventDefault()
		e.stopPropagation()
	}

	const onDragEnter = (e: DragEvent) => {
		e.preventDefault()
		e.stopPropagation()
	}

	const onDragLeave = (e: DragEvent) => {
		e.preventDefault()
		e.stopPropagation()
	}

	return (
		<div
			onDrop={onDrop}
			onDragOver={onDragOver}
			onDragEnter={onDragEnter}
			onDragLeave={onDragLeave}
			className={classes.root}
		>
			<div
				className={classes.editicon}
				onClick={() => fileInput.current?.click()}
			>
				<Icon
					className={classes.editicon}
					context={context}
					icon="edit"
				/>
			</div>
			<input
				className={classes.fileinput}
				type="file"
				onChange={(e) => {
					upload(e.target.files)
				}}
				ref={fileInput}
			/>
			<img className={classes.image} src={fileUrl} />
		</div>
	)
}

export default FileUpload
