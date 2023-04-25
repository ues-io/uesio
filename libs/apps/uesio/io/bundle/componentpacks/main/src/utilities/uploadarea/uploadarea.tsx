import { FunctionComponent, DragEvent } from "react"
import { definition, styles } from "@uesio/ui"

interface UploadAreaProps extends definition.UtilityProps {
	accept?: string
	onUpload: (files: FileList | null) => void
	onDelete?: () => void
	uploadLabelId?: string
	deleteLabelId?: string
}

const StyleDefaults = Object.freeze({
	root: {},
	fileinput: {
		display: "none",
	},
})

const UploadArea: FunctionComponent<UploadAreaProps> = (props) => {
	const classes = styles.useUtilityStyles(StyleDefaults, props)

	const {
		children,
		uploadLabelId,
		deleteLabelId,
		onUpload,
		onDelete,
		accept,
	} = props

	const onDrop = (e: DragEvent) => {
		e.preventDefault()
		e.stopPropagation()
		onUpload(e.dataTransfer.files)
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
		<>
			<div
				onDrop={onDrop}
				onDragOver={onDragOver}
				onDragEnter={onDragEnter}
				onDragLeave={onDragLeave}
				className={classes.root}
			>
				{children}
			</div>
			<input
				className={classes.fileinput}
				type="file"
				accept={accept}
				onChange={(e) => {
					onUpload(e.target.files)
				}}
				id={uploadLabelId}
			/>
			{onDelete && (
				<input
					className={classes.fileinput}
					type="button"
					onClick={onDelete}
					id={deleteLabelId}
				/>
			)}
		</>
	)
}

export default UploadArea
