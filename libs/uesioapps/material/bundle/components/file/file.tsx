import React, { ReactElement } from "react"

import { FileProps } from "./filedefinition"
import { hooks, material, styles, wire } from "@uesio/ui"
import Edit from "@material-ui/icons/Edit"
import image from "../image/image"
import Icon from "../icon/icon"
import { IconProps } from "../icon/icondefinition"

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

function File(props: FileProps): ReactElement | null {
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
	const FileProps = {
		className: classes.root,
	}

	const iconProps = {
		definition: {
			type: "file",
			size: "large",
		},
		path: props.path,
		context: props.context,
	} as IconProps

	const mime = props.context.merge(props.definition.mimeType)
	const arr_mime = mime.split("/", 2)
	const mimeType = arr_mime[0]
	const mimeSubType = arr_mime[1]

	if (!preview) {
		switch (mimeType) {
			case "image":
				return (
					<material.Avatar className={classes.avatar} src={fileUrl} />
				)
				break

			default:
				return (
					<div {...FileProps}>
						<material.Avatar className={classes.avatar}>
							<Icon {...iconProps}></Icon>
						</material.Avatar>
					</div>
				)
		}
	} else {
		switch (mimeType) {
			case "image":
				return (
					<iframe src={fileUrl} width="100%" height="500px"></iframe>
				)
				break
			case "application":
				if (mimeSubType == "pdf") {
					return (
						<iframe
							src={fileUrl}
							width="100%"
							height="500px"
						></iframe>
					)
				} else {
					return (
						<material.Button
							variant="contained"
							color="primary"
							href={fileUrl}
							endIcon={<Icon {...iconProps}></Icon>}
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
