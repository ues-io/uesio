import { DECLARATIVE_COMPONENT } from "../component/component"
import { DefinitionMap, UC } from "../definition/definition"

import SlotUtility from "../utilities/slot"

const capitalizeFirst = (str: string) =>
	str.charAt(0).toUpperCase() + str.slice(1)

type SlotDefinition = {
	name?: string
	definition?: DefinitionMap
	direction?: "VERTICAL" | "HORIZONTAL"
	label?: string
}

const Slot: UC<SlotDefinition> = (props) => {
	const { path, context } = props
	const {
		direction = "VERTICAL",
		name = "components",
		label = `${capitalizeFirst(name)} Components`,
	} = props.definition
	// There must be context component data corresponding to a declarative component definition
	// for us to use as the definition for our slot to render from
	const definition = context.getComponentData(DECLARATIVE_COMPONENT)
		?.data as DefinitionMap
	if (!definition) return null
	return (
		<SlotUtility
			direction={direction}
			definition={definition}
			listName={name}
			path={path}
			context={context}
			label={label}
		/>
	)
}

Slot.displayName = "Slot"

export default Slot
