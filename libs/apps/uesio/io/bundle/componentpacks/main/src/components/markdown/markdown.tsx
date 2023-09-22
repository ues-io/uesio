import { api, styles, context, definition, component } from "@uesio/ui"
import MarkDownField from "../../utilities/markdownfield/markdownfield"

type MarkDownDefinition = {
	file?: string
	markdown?: string
	mode: context.FieldMode
}

const StyleDefaults = Object.freeze({
	root: [],
	h1: [],
	h2: [],
	h3: [],
	h4: [],
	h5: [],
	h6: [],
	p: [],
	ol: [],
	ul: [],
	li: [],
	code: [],
	a: [],
	img: [],
})

const MarkDown: definition.UC<MarkDownDefinition> = (props) => {
	const { definition, context } = props

	const classes = styles.useStyleTokens(StyleDefaults, props)

	return (
		<MarkDownField
			classes={classes}
			variant={definition[component.STYLE_VARIANT]}
			context={context}
			value={context.merge(
				definition.file
					? api.file.useFile(context, definition.file)
					: definition.markdown
			)}
			mode={"READ"}
		/>
	)
}

export default MarkDown
