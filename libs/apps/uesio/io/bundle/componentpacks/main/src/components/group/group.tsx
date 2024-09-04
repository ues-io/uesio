import { component, definition } from "@uesio/ui"
import { default as IOGroup } from "../../utilities/group/group"

type GroupDefinition = {
	components?: definition.DefinitionList
}

const Grid: definition.UC<GroupDefinition> = (props) => {
	const { context, definition, path, componentType } = props

	return (
		<IOGroup
			variant={definition[component.STYLE_VARIANT]}
			styleTokens={definition[component.STYLE_TOKENS]}
			context={context}
		>
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
