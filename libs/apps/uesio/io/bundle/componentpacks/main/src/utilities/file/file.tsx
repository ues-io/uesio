import { FunctionComponent } from "react"
import { definition, styles, collection, context, wire, api } from "@uesio/ui"
import { nanoid } from "@reduxjs/toolkit"
import FileUploadArea from "../fileuploadarea/fileuploadarea"
import Tile from "../tile/tile"
import Icon from "../icon/icon"

interface FileUtilityProps extends definition.UtilityProps {
	width?: string
	fieldId: string
	id?: string
	mode?: context.FieldMode
	record: wire.WireRecord
	wire: wire.Wire
}

const File: FunctionComponent<FileUtilityProps> = (props) => {
	const { fieldId, record, context, wire } = props

	const userFile = record.getFieldValue<wire.PlainWireRecord | undefined>(
		fieldId
	)
	const userFileId = userFile?.[collection.ID_FIELD] as string
	const fileModDate = userFile?.["uesio/core.updatedat"] as string
	const fileName = userFile?.["uesio/core.filename"] as string
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
			<FileUploadArea
				context={context}
				record={record}
				wire={wire}
				fieldId={fieldId}
				className={classes.uploadarea}
				uploadLabelId={uploadLabelId}
				deleteLabelId={deleteLabelId}
			>
				<div>Drag your file here to upload.</div>
			</FileUploadArea>
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
					<label htmlFor={deleteLabelId}>
						<Icon
							icon="delete"
							className={classes.actionbutton}
							context={context}
						/>
					</label>
				</Tile>
			)}
		</>
	)
}

export default File
