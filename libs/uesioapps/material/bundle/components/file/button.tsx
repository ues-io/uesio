import React, { FunctionComponent } from "react"
import { FileProps } from "./filedefinition"
import { hooks, material, styles } from "@uesio/ui"
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
	})
)

const Button: FunctionComponent<FileProps> = (props) => {
	const {
		context,
		definition: { fieldId, id, fileCollection, displayAs },
	} = props
	const classes = useStyles(props)
	const uesio = hooks.useUesio(props)
	const record = context.getRecord()
	const wire = context.getWire()
	if (!wire || !record || !displayAs) {
		return null
	}

	return (
		<div className={classes.root}>
			<label htmlFor={id}>
				<input
					type="file"
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

export default Button
