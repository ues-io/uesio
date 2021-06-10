import { FunctionComponent } from "react"
import { ButtonProps, ButtonDefinition } from "./buttondefinition"
import Button from "./button"
import { hooks, styles } from "@uesio/ui"

const ButtonBuilder: FunctionComponent<ButtonProps> = (props) => {
	const classes = styles.useStyles(
		{
			root: {
				pointerEvents: "none",
			},
		},
		{
			context: props.context,
		}
	)

	const uesio = hooks.useUesio(props)
	const definition = uesio.view.useDefinition(props.path) as ButtonDefinition

	return (
		<div className={classes.root}>
			<Button {...props} definition={definition} />
		</div>
	)
}

export default ButtonBuilder
