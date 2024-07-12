import { api, definition, component, styles, signal } from "@uesio/ui"
import { default as ScrollPanelUtility } from "../../utilities/scrollpanel/scrollpanel"

type Props = {
	header?: definition.DefinitionList
	content?: definition.DefinitionList
	footer?: definition.DefinitionList
	signals?: signal.SignalDefinition[]
}

const StyleDefaults = Object.freeze({
	root: [],
	header: [],
	footer: [],
	inner: [],
})

const ScrollPanel: definition.UC<Props> = (props) => {
	const { definition, context, path, componentType } = props
	const classes = styles.useStyleTokens(StyleDefaults, props)

	const handler = api.signal.getHandler(definition.signals, context)
	return (
		<ScrollPanelUtility
			id={api.component.getComponentIdFromProps(props)}
			variant={definition[component.STYLE_VARIANT]}
			context={context}
			classes={classes}
			onClick={handler}
			header={
				<component.Slot
					definition={definition}
					listName="header"
					path={path}
					context={context}
					componentType={componentType}
				/>
			}
			footer={
				<component.Slot
					definition={definition}
					listName="footer"
					path={path}
					context={context}
					componentType={componentType}
				/>
			}
		>
			<component.Slot
				definition={definition}
				listName="content"
				path={path}
				context={context}
				componentType={componentType}
			/>
		</ScrollPanelUtility>
	)
}

export default ScrollPanel
