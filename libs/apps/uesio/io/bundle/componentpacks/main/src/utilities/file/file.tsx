import { definition, styles, context } from "@uesio/ui"
import { nanoid } from "@reduxjs/toolkit"
import Tile from "../tile/tile"
import Icon from "../icon/icon"
import UploadArea from "../uploadarea/uploadarea"
import { useRef } from "react"

type FileInfo = {
	url: string
	name: string
	mimetype: string
}

interface FileUtilityProps {
	id?: string
	mode?: context.FieldMode
	fileInfo?: FileInfo
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
	const { context, fileInfo, onUpload, onDelete, accept, mode } = props

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
						!fileInfo && classes.emptystate
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

			{fileInfo && (
				<Tile context={context} className={classes.filetag}>
					<span className={classes.filename}>{fileInfo.name}</span>
					<a href={fileInfo.url} className={classes.download}>
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

export type { FileInfo }

export default File
