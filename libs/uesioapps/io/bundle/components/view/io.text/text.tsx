import { FunctionComponent } from "react"

import { TextProps } from "./textdefinition"
import { component, styles } from "@uesio/ui"

const IOText = component.registry.getUtility("io.text")

const Text: FunctionComponent<TextProps> = (props) => {
	const { definition, context } = props
	const classes = styles.useStyles(
		{
			root: {},
		},
		props
	)
	return (
		<IOText
			classes={classes}
			variant={definition["uesio.variant"]}
			context={context}
			text={definition.text}
			element={definition.element}
			color={definition.color}
		/>
	)
}

export default Text
