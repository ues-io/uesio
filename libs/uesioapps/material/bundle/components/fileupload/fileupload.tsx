import React, { FunctionComponent } from "react"
import { FileUploadProps } from "./fileuploaddefinition"
import { hooks, material, styles, wire, context, signal } from "@uesio/ui"
import Icon from "../icon/icon"

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
	fileCollection: string,
	context: context.Context
) {
	const collection = wire.getCollection()
	const collectionName = collection.getFullName()

	const idField = collection.getIdField()
	if (!idField) return

	const nameField = collection.getNameField()
	const nameNameField = nameField?.getId()
	if (!nameNameField) return

	const workspace = context.getWorkspace()

	if (selectorFiles) {
		if (selectorFiles.length !== 1) {
			throw new Error("Too many files selected")
		}

		const file = selectorFiles[0]
		await record.update(nameNameField, file.name)
		await wire.save(context)

		const recordUpd = context.getRecord()

		if (recordUpd) {
			const recordId = recordUpd.getFieldValue(idField.getId()) as string
			console.log("recordId", recordId)

			if (recordId) {
				console.log("context", context)
				console.log("file", file)
				console.log("file.name", file.name)
				console.log("fileCollection", fileCollection)
				console.log("collectionName", collectionName)
				console.log("recordId", recordId)
				console.log("fieldId", fieldId)

				await uesio.file.uploadFile(
					context,
					file,
					file.name,
					fileCollection,
					collectionName,
					recordId,
					fieldId
				)

				//location.reload()

				//TO-DO insted of navigate we might want to keep a reference to the other wire and refresh?
				//I am using two wires in the view(uesio.files) one to create files, and another to display the list of files all pointing to the same collection(files)

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
							definition.fileCollection,
							context
						)
					}
				/>
				<material.Button
					color="primary"
					variant="contained"
					component="span"
				>
					<Icon
						definition={{
							type: "librayadd",
							size: "small",
						}}
						path={props.path}
						context={props.context}
					/>
				</material.Button>
			</label>
		</div>
	)
}

export default FileUpload
