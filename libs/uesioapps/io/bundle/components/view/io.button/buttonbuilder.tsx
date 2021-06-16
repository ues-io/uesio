import { FunctionComponent } from "react"
import { ButtonProps, ButtonDefinition } from "./buttondefinition"
import Button from "./button"
import { hooks, styles, component } from "@uesio/ui"

const ButtonBuilder: FunctionComponent<ButtonProps> = (props) => {
	const classes = styles.useStyles(
		{
			inner: {
				pointerEvents: "none",
			},
		},
		{
			context: props.context,
		}
	)

	const BuildWrapper = component.registry.getUtility("studio.buildwrapper")

	return (
		<BuildWrapper {...props} classes={classes}>
			<Button {...props} />
		</BuildWrapper>
	)
}

export default ButtonBuilder
