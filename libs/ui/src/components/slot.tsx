import { DECLARATIVE_COMPONENT } from "../component/component"
import { DefinitionMap, UC } from "../definition/definition"

import SlotUtility, { DefaultSlotName } from "../utilities/slot"

const SlotComponentId = "uesio/core.slot"

type SlotDefinition = {
	name?: string
	definition?: DefinitionMap
	readonly?: boolean
	path: string
}

const Slot: UC<SlotDefinition> = (props) => {
	const { context, componentType } = props
	const {
		name = DefaultSlotName,
		definition,
		readonly,
		path,
	} = props.definition

	if (!definition) return null
	return (
		<SlotUtility
			definition={definition}
			listName={name}
			readonly={readonly}
			path={path}
			context={context.removeAllComponentFrames(DECLARATIVE_COMPONENT)}
			componentType={componentType}
		/>
	)
}

Slot.displayName = "Slot"

export { SlotComponentId }

export default Slot
