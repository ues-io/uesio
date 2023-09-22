import { api, definition, component } from "@uesio/ui"
import { default as ScrollPanelUtility } from "../../utilities/scrollpanel/scrollpanel"

type Props = {
	header?: definition.DefinitionList
	content?: definition.DefinitionList
	footer?: definition.DefinitionList
}

const ScrollPanel: definition.UC<Props> = (props) => {
	const { definition, context, path } = props

	return (
		<ScrollPanelUtility
			id={api.component.getComponentIdFromProps(props)}
			variant={definition[component.STYLE_VARIANT]}
			context={context}
			header={
				<component.Slot
					definition={definition}
					listName="header"
					path={path}
					context={context}
				/>
			}
			footer={
				<component.Slot
					definition={definition}
					listName="footer"
					path={path}
					context={context}
				/>
			}
		>
			<component.Slot
				definition={definition}
				listName="content"
				path={path}
				context={context}
			/>
		</ScrollPanelUtility>
	)
}

export default ScrollPanel
