import { FunctionComponent, DragEvent } from "react"
import { definition, styles } from "@uesio/ui"

interface UploadAreaProps extends definition.UtilityProps {
	accept?: string
	upload: (files: FileList | null) => void
	inputRef: React.RefObject<HTMLInputElement>
}

const UploadArea: FunctionComponent<UploadAreaProps> = (props) => {
	const classes = styles.useUtilityStyles(
		{
			root: {},
			fileinput: {
				display: "none",
			},
		},
		props
	)

	const { children, inputRef, upload, accept } = props

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
					upload(e.target.files)
				}}
				ref={inputRef}
			/>
		</>
	)
}

export default UploadArea
