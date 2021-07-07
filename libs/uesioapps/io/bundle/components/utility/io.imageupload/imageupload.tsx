import {
	FunctionComponent,
	DragEvent,
	useRef,
	CSSProperties,
	useState,
} from "react"
import {
	definition,
	styles,
	collection,
	component,
	context,
	wire,
	hooks,
} from "@uesio/ui"

interface ImageUploadProps extends definition.UtilityProps {
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

const ImageUpload: FunctionComponent<ImageUploadProps> = (props) => {
	const uesio = hooks.useUesio(props)
	// const { fieldMetadata, record, context, wire } = props
	const { context } = props
	// const fieldId = fieldMetadata.getId()

	const fileInput = useRef<HTMLInputElement>(null)
	const [showTools, setShowTools] = useState<boolean>(true)

	// const userFile = record.getFieldReference(fieldId)
	// const userFileId = userFile?.["uesio.id"] as string
	// const fileUrl = uesio.file.getUserFileURL(context, userFileId, true)

	const actionIconStyles: CSSProperties = {
		cursor: "pointer",
		padding: "4px",
		margin: "4px",
		color: "white",
		backdropFilter: "brightness(0.6)",
		borderRadius: "4px",
		display: "block",
		position: "absolute",
		top: "0",
	}

	const classes = styles.useUtilityStyles(
		{
			root: {
				position: "relative",
			},
			image: {
				width: "100%",
				display: "block",
			},
			editicon: {
				right: "0",
				...actionIconStyles,
			},
			deleteicon: {
				left: "0",
				...actionIconStyles,
			},
			fileinput: {
				display: "none",
			},
			nofile: {
				display: "flex",
				backgroundColor: "#f5f5f5",
				justifyContent: "center",
			},
			nofileicon: {
				fontSize: "80px",
				padding: "32px",
				color: "#ccc",
			},
		},
		props
	)

	const upload = async (files: FileList | null) => {
		if (files && files.length > 0) {
			// const collection = wire.getCollection()
			// const collectionFullName = collection.getFullName()
			// const recordId = record.getIdFieldValue() as string
			const file = files[0]
			const fileId = await uesio.file.uploadFile(
				uesio.getContext(),
				file,
				"studio:files",
				"recordid",
				"fieldId"
			)
			// record.set(fieldId, fileId)
		}
	}

	// const deleteFile = async () => {
	// 	await uesio.file.deleteFile(uesio.getContext(), userFileId)
	// 	record.set(fieldId, "")
	// }

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
			onMouseEnter={() => setShowTools(true)}
			onMouseLeave={() => setShowTools(false)}
			className={classes.root}
		>
			<div
				className={classes.editicon}
				onClick={() => fileInput.current?.click()}
			>
				<Icon context={context} icon="edit" />
			</div>

			<input
				className={classes.fileinput}
				type="file"
				onChange={(e) => {
					upload(e.target.files)
				}}
				ref={fileInput}
			/>
		</div>
	)
}

export default ImageUpload
