import { definition, styles, collection, context, api } from "@uesio/ui"
import { nanoid } from "@reduxjs/toolkit"
import Tile from "../tile/tile"
import Icon from "../icon/icon"
import UploadArea from "../uploadarea/uploadarea"
import { UserFileMetadata } from "../../components/field/field"
import { useRef } from "react"

interface FileUtilityProps {
	id?: string
	mode?: context.FieldMode
	userFile?: UserFileMetadata
	onUpload: (files: FileList | null) => void
	onDelete?: () => void
	accept?: string
}

const StyleDefaults = Object.freeze({
	uploadarea: [
		"border(& dashed slate-300 4)",
		"rounded-lg",
		"p-10",
		"text-xs",
		"align-center",
	],
	filetag: [
		"p-1",
		"my-2",
		"border",
		"border-slate-200",
		"inline-block",
		"rounded",
		"bg-slate-100",
	],
	emptystate: [
		"hover:border(& dashed blue-500 4)",
		"text-md",
		"cursor-pointer",
	],
	filename: ["text-xs", "text-slate-700", "px-2", "py1"],
	download: [],
	actionbutton: ["p-1", "cursor-pointer", "m-1", "text-slate-700"],
})

const File: definition.UtilityComponent<FileUtilityProps> = (props) => {
	const { context, userFile, onUpload, onDelete, accept, mode } = props

	const userFileId = userFile?.[collection.ID_FIELD]
	const fileModDate = userFile?.[collection.UPDATED_AT_FIELD]
	const fileName = userFile?.["uesio/core.path"]
	const fileUrl = api.file.getUserFileURL(context, userFileId, fileModDate)

	const classes = styles.useUtilityStyleTokens(StyleDefaults, props)

	const uploadLabelId = nanoid()
	const deleteLabelId = nanoid()

	const fileInputRef = useRef<HTMLInputElement>(null)

	return (
		<>
			{mode === "EDIT" && (
				<UploadArea
					onUpload={onUpload}
					onDelete={onDelete}
					context={context}
					accept={accept}
					className={styles.cx(
						classes.uploadarea,
						!userFileId && classes.emptystate
					)}
					uploadLabelId={uploadLabelId}
					deleteLabelId={deleteLabelId}
					fileInputRef={fileInputRef}
					onClick={() => {
						fileInputRef.current?.click()
					}}
				>
					<div>Click or drag your file here to upload.</div>
				</UploadArea>
			)}

			{userFileId && (
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
