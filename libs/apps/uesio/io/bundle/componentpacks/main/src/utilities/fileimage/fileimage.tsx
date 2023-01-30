import { FunctionComponent, CSSProperties } from "react"
import { definition, styles, collection, context, api } from "@uesio/ui"
import { nanoid } from "@reduxjs/toolkit"
import Icon from "../icon/icon"
import { UserFileMetadata } from "../../components/field/field"
import UploadArea from "../uploadarea/uploadarea"

interface FileImageProps extends definition.UtilityProps {
	id?: string
	mode?: context.FieldMode
	userFile?: UserFileMetadata
	onUpload: (files: FileList | null) => void
	onDelete?: () => void
	accept?: string
}

const FileImage: FunctionComponent<FileImageProps> = (props) => {
	const { context, mode, userFile, accept, onUpload, onDelete } = props

	const userFileId = userFile?.[collection.ID_FIELD] as string
	const userModDate = userFile?.[collection.UPDATED_AT_FIELD]
	const fileUrl = api.file.getUserFileURL(context, userFileId, userModDate)

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
		<UploadArea
			onUpload={onUpload}
			onDelete={onDelete}
			context={context}
			accept={accept}
			className={classes.root}
			uploadLabelId={uploadLabelId}
			deleteLabelId={deleteLabelId}
		>
			{mode === "EDIT" && (
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
			)}
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

export default FileImage
