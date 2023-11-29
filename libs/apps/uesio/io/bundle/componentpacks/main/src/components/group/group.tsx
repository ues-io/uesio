import { component, styles, definition } from "@uesio/ui"
import { default as IOGroup } from "../../utilities/group/group"

type GroupDefinition = {
	components?: definition.DefinitionList
}

const StyleDefaults = Object.freeze({
	root: [],
})

const Grid: definition.UC<GroupDefinition> = (props) => {
	const { context, definition, path, componentType } = props
	const classes = styles.useStyleTokens(StyleDefaults, props)
	return (
		<IOGroup classes={classes} context={context}>
			<component.Slot
				definition={definition}
				listName="components"
				path={path}
				context={context}
				componentType={componentType}
			/>
		</IOGroup>
	)
}

export default Grid
