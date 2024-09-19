import { DefinitionMap, UC } from "../definition/definition"

import SlotUtility, { DefaultSlotName } from "../utilities/slot"

const SlotComponentId = "uesio/core.slot"

type SlotDefinition = {
	name?: string
	definition?: DefinitionMap
}

const Slot: UC<SlotDefinition> = (props) => {
	const { context, componentType, path } = props
	const { name = DefaultSlotName, definition } = props.definition

	if (!definition) return null
	return (
		<SlotUtility
			definition={definition}
			listName={name}
			path={path}
			context={context}
			componentType={componentType}
		/>
	)
}

Slot.displayName = "Slot"

export { SlotComponentId }

export default Slot
