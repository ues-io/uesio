import { api, styles, definition } from "@uesio/ui"
import IOLink from "../../utilities/link/link"

type LinkDefinition = {
	text?: string
	link?: string
	newTab?: boolean
}

const StyleDefaults = Object.freeze({
	root: [],
})

const Link: definition.UC<LinkDefinition> = (props) => {
	const { definition, context } = props
	const classes = styles.useStyleTokens(StyleDefaults, props)

	return (
		<IOLink
			id={api.component.getComponentIdFromProps(props)}
			classes={classes}
			context={context}
			link={definition.link}
			text={definition.text}
			newTab={definition.newTab}
		/>
	)
}

export default Link
