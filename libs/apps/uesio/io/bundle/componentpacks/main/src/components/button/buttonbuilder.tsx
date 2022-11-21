import { FunctionComponent } from "react"
import { ButtonProps } from "./buttondefinition"
import Button from "./button"
import { styles, component } from "@uesio/ui"

const BuildWrapper = component.getUtility("uesio/builder.buildwrapper")

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

	return (
		<BuildWrapper {...props} classes={classes}>
			<Button {...props} />
		</BuildWrapper>
	)
}

export default ButtonBuilder
