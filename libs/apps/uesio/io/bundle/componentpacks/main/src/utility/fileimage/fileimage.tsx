import { FunctionComponent, CSSProperties } from "react"
import {
	definition,
	styles,
	collection,
	component,
	context,
	wire,
	hooks,
} from "@uesio/ui"
import { nanoid } from "@reduxjs/toolkit"

interface FileImageProps extends definition.UtilityProps {
	width?: string
	fieldMetadata: collection.Field
	fieldId: string
	id?: string
	mode?: context.FieldMode
	record: wire.WireRecord
	wire: wire.Wire
}

const Icon = component.getUtility("uesio/io.icon")
const FileUploadArea = component.getUtility("uesio/io.fileuploadarea")

const FileImage: FunctionComponent<FileImageProps> = (props) => {
	const uesio = hooks.useUesio(props)
	const { fieldMetadata, fieldId, record, context, wire } = props

	const userFile = record.getFieldValue<wire.PlainWireRecord>(fieldId)
	const userFileId = userFile?.[collection.ID_FIELD] as string
	const userModDate = userFile?.["uesio/core.updatedat"] as string
	const accept = fieldMetadata.getAccept()
	const fileUrl = uesio.file.getUserFileURL(context, userFileId, userModDate)

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

	const uploadLabelId = nanoid()
	const deleteLabelId = nanoid()

	return (
		<FileUploadArea
			context={context}
			record={record}
			wire={wire}
			accept={accept}
			fieldId={fieldId}
			className={classes.root}
			uploadLabelId={uploadLabelId}
			deleteLabelId={deleteLabelId}
		>
			{
				<>
					<label
						className={styles.cx(classes.editicon, "hovershow")}
						htmlFor={uploadLabelId}
					>
						<Icon context={context} icon="edit" />
					</label>
					{userFileId && (
						<label
							className={styles.cx(
								classes.deleteicon,
								"hovershow"
							)}
							htmlFor={deleteLabelId}
						>
							<Icon context={context} icon="delete" />
						</label>
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
		</FileUploadArea>
	)
}

export default FileImage
