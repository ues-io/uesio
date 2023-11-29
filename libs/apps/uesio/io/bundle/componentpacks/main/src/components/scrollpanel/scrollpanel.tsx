import { api, definition, component, styles } from "@uesio/ui"
import { default as ScrollPanelUtility } from "../../utilities/scrollpanel/scrollpanel"

type Props = {
	header?: definition.DefinitionList
	content?: definition.DefinitionList
	footer?: definition.DefinitionList
}

const StyleDefaults = Object.freeze({
	root: [],
	inner: [],
})

const ScrollPanel: definition.UC<Props> = (props) => {
	const { definition, context, path, componentType } = props
	const classes = styles.useStyleTokens(StyleDefaults, props)
	return (
		<ScrollPanelUtility
			id={api.component.getComponentIdFromProps(props)}
			variant={definition[component.STYLE_VARIANT]}
			context={context}
			classes={classes}
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
