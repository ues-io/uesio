import {
	DECLARATIVE_COMPONENT,
	DeclarativeComponentSlotContext,
} from "../component/component"
import { DefinitionMap, UC } from "../definition/definition"

import SlotUtility, {
	DefaultSlotDirection,
	DefaultSlotName,
	SlotDirection,
} from "../utilities/slot"

const SlotComponentId = "uesio/core.slot"

const capitalizeFirst = (str: string) =>
	str.charAt(0).toUpperCase() + str.slice(1)

type SlotDefinition = {
	name?: string
	definition?: DefinitionMap
	direction?: SlotDirection
	label?: string
}

const Slot: UC<SlotDefinition> = (props) => {
	const { context } = props
	const {
		direction = DefaultSlotDirection,
		name = DefaultSlotName,
		label = name === DefaultSlotName
			? "Components Slot"
			: `${capitalizeFirst(name)} Components`,
	} = props.definition
	// There must be context component data corresponding to a declarative component definition
	// for us to use as the definition for our slot to render from
	const declarativeComponentSlotContext = context.getComponentData(
		DECLARATIVE_COMPONENT
	)?.data as DeclarativeComponentSlotContext
	if (!declarativeComponentSlotContext) return null
	return (
		<SlotUtility
			direction={direction}
			definition={declarativeComponentSlotContext.slotDefinitions}
			listName={name}
			path={declarativeComponentSlotContext.path}
			context={context}
			label={label}
		/>
	)
}

Slot.displayName = "Slot"

export { SlotComponentId }

export default Slot
