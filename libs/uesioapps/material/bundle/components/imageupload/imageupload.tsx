import { FunctionComponent } from "react"

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
		input: {
			display: "none",
		},
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
	const collectionFullName = collection.getFullName()

	const idField = collection.getIdField()
	if (!idField) return

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
			collectionFullName,
			recordId,
			fieldId
		)

		record.set(fieldId, fileId)
	}
}

const ImageUpload: FunctionComponent<ImageUploadProps> = (props) => {
	const {
		context,
		definition: { fieldId, id, preview, fileCollection },
	} = props
	const classes = useStyles(props)
	const uesio = hooks.useUesio(props)
	const record = context.getRecord()
	const wire = context.getWire()
	if (!wire || !record) {
		return null
	}

	const userFileId = record.getFieldValue(fieldId) as string
	const fileUrl = uesio.file.getUserFileURL(context, userFileId, true)
	const mode = context.getFieldMode() || "READ"

	if (mode === "READ" && preview && fileUrl) {
		return (
			<div className={classes.root}>
				<material.Avatar className={classes.avatar} src={fileUrl} />
			</div>
		)
	} else if (mode === "EDIT") {
		return (
			<div className={classes.root}>
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
