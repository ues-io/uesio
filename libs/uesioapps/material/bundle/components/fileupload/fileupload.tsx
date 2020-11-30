import React, { ReactElement } from "react"
import { FileUploadProps } from "./fileuploaddefinition"
import { hooks, material, styles, wire, signal } from "@uesio/ui"

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
	record: wire.WireRecord,
	wire: wire.Wire,
	uesio: hooks.Uesio,
	fileCollection: string,
	signals: signal.SignalDefinition[]
) {
	const collection = wire.getCollection()
	const collectionName = wire.getCollectionName()

	const IdField = collection.getIdField()
	const collectionNamespace = collection.getNamespace()

	const context = uesio.getContext()
	const workspace = context.getWorkspace()

	const recordId = record.getFieldValue(
		collectionNamespace + "." + IdField.getId()
	) as string

	if (selectorFiles && recordId) {
		if (selectorFiles.length !== 1) {
			throw new Error("Too many files selected")
		}

		const file = selectorFiles[0]

		const fileId = await uesio.file.uploadFile(
			context,
			file,
			file.name,
			fileCollection,
			collectionName,
			recordId,
			fieldId
		)

		const navigateSig = {
			signal: "route/NAVIGATE",
			band: "", //TODO: remove this
			path:
				`app/` +
				workspace?.app +
				`/workspace/` +
				workspace?.name +
				`/files`,
			namespace: "uesio",
		} as signal.SignalDefinition

		const result = await uesio.signal.run(navigateSig, context)
	}
}

function FileUpload(props: FileUploadProps): ReactElement | null {
	const classes = useStyles(props)
	const uesio = hooks.useUesio(props)
	const record = props.context.getRecord()
	const wire = props.context.getWire()
	if (!wire || !record) {
		return null
	}

	const fieldId = props.definition.fieldId
	const id = props.definition.id
	const signals = props.definition.signals
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
							record,
							wire,
							uesio,
							fileCollection,
							signals
						)
					}
				/>
				<material.Button
					color="primary"
					variant="contained"
					component="span"
					onClick={
						props.definition?.signals &&
						uesio.signal.getHandler(props.definition.signals)
					}
				>
					Upload New File
				</material.Button>
			</label>
		</div>
	)

	return null
}

export default FileUpload
