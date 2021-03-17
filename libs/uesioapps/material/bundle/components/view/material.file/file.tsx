import { FunctionComponent } from "react"

import { FileProps } from "./filedefinition"
import { hooks, styles, wire } from "@uesio/ui"
import Icon from "../material.icon/icon"
import Button from "./button"
import EditWrapper from "./editwrapper"
import * as material from "@material-ui/core"
const useStyles = material.makeStyles((theme) =>
	material.createStyles({
		root: (props: FileProps) => ({
			display: "block",
			lineHeight: 0,
			...styles.getMarginStyles(
				props.definition.margin,
				props.context.getTheme()
			),
		}),
		avatar: ({ definition }: FileProps) => ({
			width: definition?.width ? definition.width : 200,
			height: definition?.height ? definition.height : 200,
		}),
		smallavatar: ({ definition }: FileProps) => ({
			width: definition?.width ? definition.width / 4 : 50,
			height: definition?.height ? definition.height / 4 : 50,
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

const File: FunctionComponent<FileProps> = (props) => {
	const {
		context,
		definition: { fieldId, displayAs, height, width, editable },
	} = props
	const classes = useStyles(props)
	const uesio = hooks.useUesio(props)
	const record = context.getRecord()
	const wire = context.getWire()
	if (!wire || !record || !displayAs) {
		return null
	}

	const userFile = record.getFieldValue(fieldId) as
		| wire.PlainWireRecord
		| undefined

	if (displayAs === "button") {
		return (
			<Button
				definition={props.definition}
				path={props.path}
				context={context}
			/>
		)
	}

	//no file url EQ empty unless Button
	if (!userFile) {
		return (
			<EditWrapper
				definition={props.definition}
				path={props.path}
				context={context}
			/>
		)
	}

	const userFileId = userFile["uesio.id"] as string
	const mime = userFile["uesio.mimetype"] as string
	const fileUrl = uesio.file.getUserFileURL(context, userFileId, true)

	const iconJsx = (
		<Icon
			definition={{
				type: "file",
				size: "large",
			}}
			path={props.path}
			context={props.context}
		/>
	)

	if (mime) {
		const arrMime = mime.split("/", 2)
		const [mimeType, mimeSubType] = arrMime

		const imgPreview = (
			<material.Avatar className={classes.avatar} src={fileUrl} />
		)

		const imgFullPreview = (
			<img src={fileUrl} height={height} width={width} />
		)

		switch (mimeType) {
			case "image":
				if (displayAs === "preview" && !editable) {
					return <div className={classes.root}>{imgPreview}</div>
				} else if (displayAs === "fullPreview" && !editable) {
					return <div className={classes.root}>{imgFullPreview}</div>
				} else if (displayAs === "preview" && editable) {
					return (
						<EditWrapper
							definition={props.definition}
							path={props.path}
							context={context}
						>
							{imgPreview}
						</EditWrapper>
					)
				} else if (displayAs === "fullPreview" && editable) {
					return (
						<EditWrapper
							definition={props.definition}
							path={props.path}
							context={context}
						>
							{imgFullPreview}
						</EditWrapper>
					)
				}
				break
			case "application":
				if (displayAs === "preview" && !editable) {
					return (
						<div className={classes.root}>
							<material.Avatar className={classes.avatar}>
								{iconJsx}
							</material.Avatar>
						</div>
					)
				} else if (
					displayAs === "fullPreview" &&
					mimeSubType === "pdf" &&
					!editable
				) {
					return (
						<div className={classes.root}>
							(
							<iframe src={fileUrl} width="100%" height="500px" />
							)
						</div>
					)
				} else if (displayAs === "preview" && editable) {
					return (
						<EditWrapper
							definition={props.definition}
							path={props.path}
							context={context}
						/>
					)
				} else if (
					displayAs === "fullPreview" &&
					mimeSubType === "pdf" &&
					editable
				) {
					return (
						<EditWrapper
							definition={props.definition}
							path={props.path}
							context={context}
						>
							<iframe src={fileUrl} width="100%" height="500px" />
						</EditWrapper>
					)
				} else if (mimeSubType !== "pdf") {
					return (
						<material.Button
							variant="contained"
							color="primary"
							href={fileUrl}
							endIcon={iconJsx}
						>
							Download
						</material.Button>
					)
				}
				break
			default:
		}
	}

	return null
}

export { handleChange }

export default File
