import { api, definition, component, signal } from "@uesio/ui"
import { default as ScrollPanelUtility } from "../../utilities/scrollpanel/scrollpanel"

type Props = {
	header?: definition.DefinitionList
	content?: definition.DefinitionList
	footer?: definition.DefinitionList
	signals?: signal.SignalDefinition[]
}

const ScrollPanel: definition.UC<Props> = (props) => {
	const { definition, context, path, componentType } = props

	const isSelected = component.shouldHaveClass(
		context,
		"selected",
		definition
	)

	const handler = api.signal.getHandler(definition.signals, context)
	return (
		<ScrollPanelUtility
			id={api.component.getComponentIdFromProps(props)}
			variant={definition[component.STYLE_VARIANT]}
			styleTokens={definition[component.STYLE_TOKENS]}
			context={context}
			onClick={handler}
			isSelected={isSelected}
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
