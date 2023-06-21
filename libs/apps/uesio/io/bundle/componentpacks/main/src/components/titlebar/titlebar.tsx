import { component, definition, styles } from "@uesio/ui"
import { default as IOTitleBar } from "../../utilities/titlebar/titlebar"

type TitleBarDefinition = {
	title: string
	subtitle: string
}

const StyleDefaults = Object.freeze({
	root: [],
	content: [],
	title: [],
	subtitle: [],
	actions: [],
})

const TitleBar: definition.UC<TitleBarDefinition> = (props) => {
	const { definition, path, context } = props

	const classes = styles.useStyleTokens(StyleDefaults, props)

	return (
		<IOTitleBar
			classes={classes}
			context={context}
			variant={definition["uesio.variant"]}
			title={definition.title}
			subtitle={definition.subtitle}
			actions={
				<component.Slot
					definition={definition}
					listName="actions"
					path={path}
					context={context}
					label="Title Bar Actions"
				/>
			}
		/>
	)
}

export default TitleBar
