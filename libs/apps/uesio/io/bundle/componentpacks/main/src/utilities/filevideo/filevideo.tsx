import { definition, styles, collection, context, api } from "@uesio/ui"
import { nanoid } from "@reduxjs/toolkit"
import Icon from "../icon/icon"
import { UserFileMetadata } from "../../components/field/field"
import UploadArea from "../uploadarea/uploadarea"
import { StyleDefaults } from "../fileimage/fileimage"

interface FileVideoProps {
	id?: string
	mode?: context.FieldMode
	userFile?: UserFileMetadata
	onUpload: (files: FileList | null) => void
	onDelete?: () => void
	accept?: string
	muted?: boolean
	autoplay?: boolean
}

const FileVideo: definition.UtilityComponent<FileVideoProps> = (props) => {
	const {
		mode,
		context,
		autoplay,
		muted,
		userFile,
		onUpload,
		onDelete,
		accept,
	} = props

	const userFileId = userFile?.[collection.ID_FIELD]
	const userModDate = userFile?.[collection.UPDATED_AT_FIELD]
	const fileUrl = api.file.getUserFileURL(context, userFileId, userModDate)

	const classes = styles.useUtilityStyleTokens(StyleDefaults, props)

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
						className={styles.cx(
							classes.editicon,
							classes.actionicon
						)}
						htmlFor={uploadLabelId}
					>
						<Icon context={context} icon="edit" />
					</label>
					{userFileId && (
						<label
							className={styles.cx(
								classes.deleteicon,
								classes.actionicon
							)}
							htmlFor={deleteLabelId}
						>
							<Icon context={context} icon="delete" />
						</label>
					)}
				</>
			)}
			{userFileId ? (
				<>
					<video autoPlay={autoplay || true} muted={muted || true}>
						<source src={fileUrl} />
						Your browser does not support the video tag.
					</video>
				</>
			) : (
				<div className={classes.nofile}>
					<Icon
						className={classes.nofileicon}
						context={context}
						icon="movie"
					/>
				</div>
			)}
		</UploadArea>
	)
}

export default FileVideo
