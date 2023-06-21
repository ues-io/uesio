import { api, styles, context, definition } from "@uesio/ui"
import MarkDownField from "../../utilities/markdownfield/markdownfield"

type MarkDownDefinition = {
	file?: string
	markdown?: string
	mode: context.FieldMode
}

const StyleDefaults = Object.freeze({
	root: [],
})

const MarkDown: definition.UC<MarkDownDefinition> = (props) => {
	const { definition, context } = props

	const classes = styles.useStyleTokens(StyleDefaults, props)

	return (
		<MarkDownField
			classes={classes}
			variant={definition["uesio.variant"]}
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
