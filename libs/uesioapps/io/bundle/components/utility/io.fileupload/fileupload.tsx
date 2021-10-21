import { FunctionComponent, useRef, CSSProperties } from "react"
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
const UploadArea = component.registry.getUtility("io.uploadarea")

const FileUpload: FunctionComponent<FileUploadProps> = (props) => {
	const uesio = hooks.useUesio(props)
	const { fieldMetadata, record, context, wire } = props
	const fieldId = fieldMetadata.getId()

	const fileInput = useRef<HTMLInputElement>(null)

	const userFile = record.getFieldValue<wire.PlainWireRecord | undefined>(
		fieldId
	)
	const userFileId = userFile?.["uesio.id"] as string
	const fileName = userFile?.["uesio.name"] as string
	const mimeType = userFile?.["uesio.mimetype"] as string
	const accept = fieldMetadata.getAccept()
	const fileUrl = uesio.file.getUserFileURL(context, userFileId, true)

	const actionIconStyles: CSSProperties = {
		cursor: "pointer",
		padding: "4px",
		margin: "4px",
		color: "white",
		backdropFilter: "brightness(0.6)",
		borderRadius: "4px",
		display: "none",
		position: "absolute",
		top: "0",
	}

	const classes = styles.useUtilityStyles(
		{
			root: {
				position: "relative",
				"&:hover .hovershow": {
					display: "block",
				},
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

	const deleteFile = async () => {
		await uesio.file.deleteFile(uesio.getContext(), userFileId)
		record.set(fieldId, "")
	}

	return (
		<UploadArea
			context={context}
			inputRef={fileInput}
			upload={upload}
			accept={accept}
			className={classes.root}
		>
			{
				<>
					<div
						className={styles.cx(classes.editicon, "hovershow")}
						onClick={() => fileInput.current?.click()}
					>
						<Icon context={context} icon="edit" />
					</div>
					{userFileId && (
						<div
							className={styles.cx(
								classes.deleteicon,
								"hovershow"
							)}
							onClick={() => deleteFile()}
						>
							<Icon context={context} icon="delete" />
						</div>
					)}
				</>
			}
			{userFileId ? (
				<img className={classes.image} src={fileUrl} />
			) : (
				<div className={classes.nofile}>
					<Icon
						className={classes.nofileicon}
						context={context}
						icon="person"
					/>
				</div>
			)}
		</UploadArea>
	)
}

export default FileUpload
