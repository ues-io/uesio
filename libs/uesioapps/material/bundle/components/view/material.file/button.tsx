import { FunctionComponent } from "react"
import { FileProps } from "./filedefinition"
import { hooks, styles } from "@uesio/ui"
import Icon from "../material.icon/icon"
import { handleChange } from "./file"
import * as material from "@material-ui/core"

const useStyles = material.makeStyles(() =>
	material.createStyles({
		root: (props: FileProps) => ({
			display: "block",
			lineHeight: 0,
			...styles.getMarginStyles(
				props.definition?.margin,
				props.context.getTheme()
			),
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
						handleChange(
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
