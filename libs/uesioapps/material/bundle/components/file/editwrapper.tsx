import React, { FunctionComponent } from "react"

import { FileProps } from "./filedefinition"
import { hooks, material, styles } from "@uesio/ui"
import Edit from "@material-ui/icons/Edit"
import Icon from "../icon/icon"
import { HandleChange } from "./file"

const useStyles = material.makeStyles((theme) =>
	material.createStyles({
		root: (props: FileProps) => ({
			display: "block",
			lineHeight: 0,
			...styles.getMarginStyles(props.definition?.margin, theme),
		}),
		input: {
			display: "none",
		},
		avatar: (props: FileProps) => ({
			width: props.definition?.width ? props.definition.width : 200,
			height: props.definition?.height ? props.definition.height : 200,
		}),
		smallavatar: (props: FileProps) => ({
			width: props.definition?.width ? props.definition.width / 4 : 50,
			height: props.definition?.height ? props.definition.height / 4 : 50,
			border: `2px solid ${theme.palette.background.paper}`,
			cursor: "pointer",
		}),
	})
)

function GetAccept(accepts: string) {
	const all = "image/*,.pdf,.doc,.docx"
	switch (accepts) {
		case "all":
			return all
			break
		case "images":
			return "image/*"
			break
		default:
			return all
	}
}

const EditWrapper: FunctionComponent<FileProps> = (props) => {
	const {
		context,
		definition: { fieldId, id, fileCollection, displayAs, accepts },
	} = props
	const classes = useStyles(props)
	const uesio = hooks.useUesio(props)
	const record = context.getRecord()
	const wire = context.getWire()
	if (!wire || !record || !displayAs) {
		return null
	}
	const accept = GetAccept(accepts)

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
								accept={accept}
								className={classes.input}
								id={id}
								name={id}
								onChange={(e) =>
									HandleChange(
										e.target.files,
										fieldId,
										record,
										wire,
										uesio,
										fileCollection
									)
								}
							/>
							<material.Avatar className={classes.smallavatar}>
								<Edit />
							</material.Avatar>
						</label>
					</div>
				}
			>
				{props.children ? (
					props.children
				) : (
					<material.Avatar className={classes.avatar}>
						{iconJsx}
					</material.Avatar>
				)}
			</material.Badge>
		</div>
	)
}

export default EditWrapper
