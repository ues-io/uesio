import { FunctionComponent } from "react"
import { definition, styles, collection, context, api } from "@uesio/ui"
import { nanoid } from "@reduxjs/toolkit"
import Tile from "../tile/tile"
import Icon from "../icon/icon"
import UploadArea from "../uploadarea/uploadarea"
import { UserFileMetadata } from "../../components/field/field"

interface FileUtilityProps extends definition.UtilityProps {
	id?: string
	mode?: context.FieldMode
	userFile?: UserFileMetadata
	onUpload: (files: FileList | null) => void
	onDelete?: () => void
	accept?: string
}

const File: FunctionComponent<FileUtilityProps> = (props) => {
	const { context, userFile, onUpload, onDelete, accept, mode } = props

	const userFileId = userFile?.[collection.ID_FIELD]
	const fileModDate = userFile?.[collection.UPDATED_AT_FIELD]
	const fileName = userFile?.["uesio/core.path"]
	const fileUrl = api.file.getUserFileURL(context, userFileId, fileModDate)

	const classes = styles.useUtilityStyles(
		{
			uploadarea: {
				border: "1px dashed #eee",
				borderRadius: "20px",
				padding: "40px",
				fontSize: "9pt",
				color: "#999",
				textAlign: "center",
			},
			filetag: {
				padding: "4px 10px",
				marginTop: "10px",
				border: "1px solid #eee",
				display: "inline-block",
				borderRadius: "4px",
				backgroundColor: "#f8f8f8",
			},
			filename: {
				fontSize: "9pt",
				color: "#777",
				padding: "4px",
			},
			download: {
				textDecoration: "none",
				color: "inherit",
			},
			actionbutton: {
				padding: "4px",
				cursor: "pointer",
				margin: "4px",
				color: "#777",
			},
		},
		props
	)

	const uploadLabelId = nanoid()
	const deleteLabelId = nanoid()

	return (
		<>
			{mode === "EDIT" && (
				<UploadArea
					onUpload={onUpload}
					onDelete={onDelete}
					context={context}
					accept={accept}
					className={classes.uploadarea}
					uploadLabelId={uploadLabelId}
					deleteLabelId={deleteLabelId}
				>
					<div>Drag your file here to upload.</div>
				</UploadArea>
			)}

			{userFile && (
				<Tile context={context} className={classes.filetag}>
					<span className={classes.filename}>{fileName}</span>
					<a href={fileUrl} className={classes.download}>
						<Icon
							icon="file_download"
							className={classes.actionbutton}
							context={context}
						/>
					</a>
					{mode === "EDIT" && (
						<label htmlFor={deleteLabelId}>
							<Icon
								icon="delete"
								className={classes.actionbutton}
								context={context}
							/>
						</label>
					)}
				</Tile>
			)}
		</>
	)
}

export default File
