/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/ban-types */
import React, { FunctionComponent } from "react"

import { FileProps } from "./filedefinition"
import { hooks, material, styles } from "@uesio/ui"
import Edit from "@material-ui/icons/Edit"
import Icon from "../icon/icon"
import { handleChange } from "./file"

const useStyles = material.makeStyles((theme) =>
	material.createStyles({
		root: ({ definition }: FileProps) => ({
			display: "block",
			lineHeight: 0,
			...styles.getMarginStyles(definition?.margin, theme),
		}),
		input: {
			display: "none",
		},
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

const getAccept = (accepts: string) =>
	accepts === "images" ? "image/*" : "image/*,.pdf,.doc,.docx"

const EditWrapper: FunctionComponent<FileProps> = (props) => {
	const {
		context,
		definition: { fieldId, id, fileCollection, displayAs, accepts },
		children,
	} = props
	const classes = useStyles(props)
	const uesio = hooks.useUesio(props)
	const record = context.getRecord()
	const wire = context.getWire()
	if (!wire || !record || !displayAs) {
		return null
	}

	const onChangeDecorator = (onChange: Function) => (...args: any) => {
		onChange(...args).then(() => {
			const wireNames = ["accounts"]
			uesio.wire.reloadWires(context, wireNames)
		})
	}

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
								accept={getAccept(accepts)}
								className={classes.input}
								id={id}
								name={id}
								onChange={(e) =>
									onChangeDecorator(handleChange)(
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
				{children ? (
					children
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
