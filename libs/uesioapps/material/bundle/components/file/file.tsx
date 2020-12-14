import React, { FunctionComponent } from "react"

import { FileProps } from "./filedefinition"
import { hooks, material, styles } from "@uesio/ui"
import Icon from "../icon/icon"

const useStyles = material.makeStyles((theme) =>
	material.createStyles({
		root: (props: FileProps) => ({
			display: "block",
			lineHeight: 0,
			...styles.getMarginStyles(props.definition?.margin, theme),
		}),
		input: (/*props: FileProps*/) => ({
			display: "none",
		}),
		avatar: (props: FileProps) => ({
			width: props.definition?.width ? props.definition.width : 200,
			height: props.definition?.height ? props.definition.height : 200,
			marginBottom: 10,
		}),
	})
)

const File: FunctionComponent<FileProps> = (props) => {
	const classes = useStyles(props)
	const uesio = hooks.useUesio(props)
	const record = props.context.getRecord()
	const wire = props.context.getWire()
	if (!wire || !record) {
		return null
	}

	const fieldId = props.definition.fieldId
	const preview = props.definition.preview
	const userFileId = record.getFieldValue(fieldId) as string
	const fileUrl = uesio.file.getUserFileURL(props.context, userFileId, true)

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

	const mime = props.context.merge(props.definition.mimeType)
	const arrMime = mime.split("/", 2)
	const [mimeType, mimeSubType] = arrMime

	if (!preview) {
		switch (mimeType) {
			case "image":
				return (
					<material.Avatar className={classes.avatar} src={fileUrl} />
				)
				break

			default:
				return (
					<div className={classes.root}>
						<material.Avatar className={classes.avatar}>
							{iconJsx}
						</material.Avatar>
					</div>
				)
		}
	} else {
		switch (mimeType) {
			case "image":
				return <iframe src={fileUrl} width="100%" height="500px" />
				break
			case "application":
				if (mimeSubType === "pdf") {
					return <iframe src={fileUrl} width="100%" height="500px" />
				} else {
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

export default File
