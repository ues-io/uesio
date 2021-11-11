import { FunctionComponent } from "react"
import Dialog from "./dialog"
import { styles, definition, component } from "@uesio/ui"

const BuildWrapper = component.registry.getUtility("studio.buildwrapper")

const DialogBuilder: FunctionComponent<definition.BaseProps> = (props) => {
	const classes = styles.useStyles(
		{
			root: {
				position: "relative",
			},
		},
		{
			context: props.context,
		}
	)

	return (
		<BuildWrapper {...props} classes={classes}>
			<Dialog {...props} />
		</BuildWrapper>
	)
}

export default DialogBuilder
