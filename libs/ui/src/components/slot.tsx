import {
	DECLARATIVE_COMPONENT,
	DeclarativeComponentSlotContext,
} from "../component/component"
import { DefinitionMap, UC } from "../definition/definition"

import SlotUtility, { DefaultSlotName } from "../utilities/slot"

const SlotComponentId = "uesio/core.slot"

type SlotDefinition = {
	name?: string
	definition?: DefinitionMap
}

const Slot: UC<SlotDefinition> = (props) => {
	const { context, componentType } = props
	const { name = DefaultSlotName } = props.definition
	// There must be context component data corresponding to a declarative component definition
	// for us to use as the definition for our slot to render from
	const declarativeComponentSlotContext = context.getComponentData(
		DECLARATIVE_COMPONENT
	)?.data as DeclarativeComponentSlotContext
	if (!declarativeComponentSlotContext) return null
	return (
		<SlotUtility
			definition={declarativeComponentSlotContext.slotDefinitions}
			listName={name}
			path={declarativeComponentSlotContext.path}
			context={declarativeComponentSlotContext.slotContext}
			componentType={componentType}
		/>
	)
}

Slot.displayName = "Slot"

export { SlotComponentId }

export default Slot
