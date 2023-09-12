import { FunctionComponent } from "react"
import {
	DefinitionList,
	DefinitionMap,
	UtilityProps,
} from "../definition/definition"
import { Component } from "../component/component"
import { MetadataKey } from "../metadata/types"
import {
	getUtilityLoader,
	registerUtilityComponent,
} from "../component/registry"

interface SlotUtilityProps extends UtilityProps {
	listName: string
	path: string
	definition?: DefinitionMap
	direction?: "VERTICAL" | "HORIZONTAL"
	label?: string
}

const getSlotProps = (props: SlotUtilityProps) => {
	const { path, context, listName } = props
	const definition = props.definition as DefinitionMap
	if (!definition) return []

	const listDef = (definition?.[listName] || []) as DefinitionList
	const listPath = path ? `${path}["${listName}"]` : `["${listName}"]`

	return listDef.flatMap((itemDef, index) => {
		if (!itemDef) return []
		const componentType = Object.keys(itemDef)[0]
		const unWrappedDef = itemDef[componentType]
		return {
			definition: unWrappedDef as DefinitionMap,
			componentType: componentType as MetadataKey,
			path: `${listPath}["${index}"]["${componentType}"]`,
			context,
		}
	})
}

const Slot: FunctionComponent<SlotUtilityProps> = (props) => {
	const slotWrapper = props.context.getCustomSlot()
	if (slotWrapper) {
		const Loader = getUtilityLoader(slotWrapper)
		if (!Loader) throw "Could not load component: " + slotWrapper
		return <Loader {...props} />
	}

	return (
		<>
			{getSlotProps(props).map((props, index) => (
				<Component key={index} {...props} />
			))}
		</>
	)
}

Slot.displayName = "Slot"

registerUtilityComponent("uesio/core.slot", Slot)

export type { SlotUtilityProps }
export { getSlotProps }
export default Slot
