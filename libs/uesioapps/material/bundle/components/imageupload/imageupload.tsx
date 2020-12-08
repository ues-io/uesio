import React, { ReactElement } from "react"

import { ImageUploadProps } from "./imageuploaddefinition"
import { hooks, material, styles, wire } from "@uesio/ui"
import Edit from "@material-ui/icons/Edit"

const useStyles = material.makeStyles((theme) =>
	material.createStyles({
		root: (props: ImageUploadProps) => ({
			display: "block",
			lineHeight: 0,
			...styles.getMarginStyles(props.definition?.margin, theme),
		}),
		input: (/*props: ImageUploadProps*/) => ({
			display: "none",
		}),
		avatar: (props: ImageUploadProps) => ({
			width: props.definition?.width ? props.definition.width : 200,
			height: props.definition?.height ? props.definition.height : 200,
		}),
		smallavatar: (props: ImageUploadProps) => ({
			width: props.definition?.width ? props.definition.width / 4 : 50,
			height: props.definition?.height ? props.definition.height / 4 : 50,
			border: `2px solid ${theme.palette.background.paper}`,
			cursor: "pointer",
		}),
	})
)

async function handleChange(
	selectorFiles: FileList | null,
	fieldId: string,
	record: wire.WireRecord,
	wire: wire.Wire,
	uesio: hooks.Uesio,
	fileCollection: string
) {
	const collection = wire.getCollection()
	const collectionName = wire.getCollectionName()

	const idField = collection.getIdField()
	if (!idField) return
	const collectionNamespace = collection.getNamespace()

	const recordId = record.getFieldValue(idField.getId()) as string
	if (selectorFiles && recordId) {
		if (selectorFiles.length !== 1) {
			throw new Error("Too many files selected")
		}

		const file = selectorFiles[0]

		const fileId = await uesio.file.uploadFile(
			uesio.getContext(),
			file,
			file.name,
			fileCollection,
			collectionName,
			recordId,
			fieldId
		)

		record.set(fieldId, fileId)
	}
}

function ImageUpload(props: ImageUploadProps): ReactElement | null {
	const classes = useStyles(props)
	const uesio = hooks.useUesio(props)
	const record = props.context.getRecord()
	const wire = props.context.getWire()
	if (!wire || !record) {
		return null
	}

	const fieldId = props.definition.fieldId
	const id = props.definition.id

	const preview = props.definition.preview
	const fileCollection = props.definition.fileCollection

	const userFileId = record.getFieldValue(fieldId) as string
	const fileUrl = uesio.file.getUserFileURL(props.context, userFileId, true)
	const ImageUploadProps = {
		className: classes.root,
	}
	const mode = props.context.getFieldMode() || "READ"

	if (mode === "READ" && preview && fileUrl) {
		return (
			<div {...ImageUploadProps}>
				<material.Avatar className={classes.avatar} src={fileUrl} />
			</div>
		)
	} else if (mode === "EDIT") {
		return (
			<div {...ImageUploadProps}>
				<material.Badge
					overlap="circle"
					anchorOrigin={{
						vertical: "bottom",
						horizontal: "right",
					}}
					badgeContent={
						<div>
							<label htmlFor={id}>
								<input
									type="file"
									accept="image/*"
									className={classes.input}
									id={id}
									name={id}
									onChange={(e) =>
										handleChange(
											e.target.files,
											fieldId,
											record,
											wire,
											uesio,
											fileCollection
										)
									}
								/>
								<material.Avatar
									className={classes.smallavatar}
								>
									<Edit />
								</material.Avatar>
							</label>
						</div>
					}
				>
					<material.Avatar className={classes.avatar} src={fileUrl} />
				</material.Badge>
			</div>
		)
	}

	return null
}

export default ImageUpload
