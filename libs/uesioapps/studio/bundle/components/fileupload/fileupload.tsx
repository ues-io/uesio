import React, { FunctionComponent } from "react"
import { FileUploadProps } from "./fileuploaddefinition"
import { hooks, material, styles, wire, signal, component } from "@uesio/ui"
//import Icon from "../icon/icon"

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
	const collectionName = collection.getFullName()

	const idField = collection.getIdField()
	if (!idField) return

	const nameField = collection.getNameField()
	const nameNameField = nameField?.getId()
	if (!nameNameField) return

	const context = uesio.getContext()

	if (selectorFiles) {
		if (selectorFiles.length !== 1) {
			throw new Error("Too many files selected")
		}

		const file = selectorFiles[0]
		const appName = context.getView()?.params?.appname
		const workspaceName = context.getView()?.params?.workspacename

		record.update(nameNameField, file.name)
		await wire.save(context)
		//TO-DO show error if record Save fail

		const recordUpd = context.getRecord()

		if (recordUpd) {
			const recordId = recordUpd.getFieldValue(idField.getId()) as string

			if (recordId) {
				await uesio.file.uploadFile(
					context,
					file,
					file.name,
					fileCollection,
					collectionName,
					recordId,
					fieldId
				)

				//TO-DO insted of navigate we might want to keep a reference to the other wire and refresh?

				const navigateSig = {
					signal: "route/NAVIGATE",
					path:
						`app/` +
						appName +
						`/workspace/` +
						workspaceName +
						`/files`,
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

	const Icon = component.registry.get("material", "icon")

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
