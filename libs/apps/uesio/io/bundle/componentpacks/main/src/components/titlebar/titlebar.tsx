import { api, component, definition, styles } from "@uesio/ui"
import { default as IOTitleBar } from "../../utilities/titlebar/titlebar"

type TitleBarDefinition = {
	title: string
	subtitle: string
	avatar?: definition.DefinitionList
	actions?: definition.DefinitionList
}

const StyleDefaults = Object.freeze({
	root: [],
	content: [],
	title: [],
	subtitle: [],
	actions: [],
	avatar: [],
})

const TitleBar: definition.UC<TitleBarDefinition> = (props) => {
	const { definition, path, context, componentType } = props

	const classes = styles.useStyleTokens(StyleDefaults, props)

	return (
		<IOTitleBar
			id={api.component.getComponentIdFromProps(props)}
			classes={classes}
			context={context}
			variant={definition[component.STYLE_VARIANT]}
			title={definition.title}
			subtitle={definition.subtitle}
			actions={
				definition.actions && (
					<component.Slot
						definition={definition}
						listName="actions"
						path={path}
						context={context}
						componentType={componentType}
					/>
				)
			}
			avatar={
				definition.avatar && (
					<component.Slot
						definition={definition}
						listName="avatar"
						path={path}
						context={context}
						componentType={componentType}
					/>
				)
			}
		/>
	)
}

export default TitleBar
