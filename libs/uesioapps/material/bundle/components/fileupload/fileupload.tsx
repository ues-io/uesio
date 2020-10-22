import React, { ReactElement } from "react"

import { FileUploadProps } from "./fileuploaddefinition"
import { hooks, material, styles, wire } from "@uesio/ui"
import Edit from "@material-ui/icons/Edit"

const useStyles = material.makeStyles((theme) =>
	material.createStyles({
		root: (props: FileUploadProps) => ({
			display: "block",
			lineHeight: 0,
			...styles.getMarginStyles(props.definition?.margin, theme),
		}),
		input: (/*props: FileUploadProps*/) => ({
			display: "none",
		}),
	})
)

async function handleChange(
	selectorFiles: FileList | null,
	fieldId: string,
	//record: wire.WireRecord,
	wire: wire.Wire,
	uesio: hooks.Uesio,
	fileCollection: string
) {
	const collection = wire.getCollection()
	const collectionName = wire.getCollectionName()

	const IdField = collection.getIdField()
	const collectionNamespace = collection.getNamespace()

	//const recordId = record.getFieldValue(
	//	collectionNamespace + "." + IdField.getId()
	//	) as string

	if (selectorFiles) {
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
			"crm_dev_" + file.name,
			fieldId
		)

		// wire.dispatchRecordSet(record.id, {
		// 	[fieldId]: fileId,
		// })
	}
}

function FileUpload(props: FileUploadProps): ReactElement | null {
	const classes = useStyles(props)
	const uesio = hooks.useUesio(props)
	//const wire = props.context.getWire()
	const wire = uesio.wire.useWire(props.definition.wire)

	if (!wire) {
		return null
	}

	const fieldId = props.definition.fieldId
	const id = props.definition.id
	const fileCollection = props.definition.fileCollection

	const FileUploadProps = {
		className: classes.root,
	}

	return (
		<div {...FileUploadProps}>
			<label htmlFor={id}>
				<input
					type="file"
					className={classes.input}
					id={id}
					name={id}
					onChange={(e) =>
						handleChange(
							e.target.files,
							fieldId,
							//record,
							wire,
							uesio,
							fileCollection
						)
					}
				/>
				<material.Button
					color="primary"
					variant="contained"
					component="span"
				>
					Upload New File
				</material.Button>
			</label>
		</div>
	)

	return null
}

export default FileUpload
