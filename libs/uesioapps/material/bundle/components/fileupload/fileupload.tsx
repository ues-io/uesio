import { FunctionComponent } from "react";
import { FileUploadProps } from "./fileuploaddefinition"
import { hooks, material, styles, wire, signal } from "@uesio/ui"

const useStyles = material.makeStyles((theme) =>
	material.createStyles({
		root: (props: FileUploadProps) => ({
			display: "block",
			lineHeight: 0,
			...styles.getMarginStyles(props.definition?.margin, theme),
		}),
		input: {
			display: "none",
		},
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
	const collectionName = collection.getId()

	const idField = collection.getIdField()
	if (!idField) return

	const context = uesio.getContext()
	const workspace = context.getWorkspace()

	const recordId = record.getFieldValue(idField.getId()) as string

	if (selectorFiles && recordId) {
		if (selectorFiles.length !== 1) {
			throw new Error("Too many files selected")
		}

		const file = selectorFiles[0]

		await uesio.file.uploadFile(
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
			path:
				`app/` +
				workspace?.app +
				`/workspace/` +
				workspace?.name +
				`/files`,
			namespace: "uesio",
		} as signal.SignalDefinition

		await uesio.signal.run(navigateSig, context)
	}
}

const FileUpload: FunctionComponent<FileUploadProps> = (props) => {
	const { definition, context } = props
	const classes = useStyles(props)
	const uesio = hooks.useUesio(props)
	const record = context.getRecord()
	const wire = context.getWire()
	if (!wire || !record) {
		return null
	}

	return (
		<div className={classes.root}>
			<label htmlFor={definition.id}>
				<input
					type="file"
					className={classes.input}
					id={definition.id}
					name={definition.id}
					onChange={(e) =>
						handleChange(
							e.target.files,
							definition.fieldId,
							record,
							wire,
							uesio,
							definition.fileCollection
						)
					}
				/>
				<material.Button
					color="primary"
					variant="contained"
					component="span"
					onClick={
						definition?.signals &&
						uesio.signal.getHandler(definition.signals)
					}
				>
					Upload New File
				</material.Button>
			</label>
		</div>
	)
}

export default FileUpload
