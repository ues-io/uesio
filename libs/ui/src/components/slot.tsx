import { FunctionComponent } from "react"
import {
	BaseDefinition,
	BaseProps,
	DefinitionList,
	DefinitionMap,
	UtilityProps,
} from "../definition/definition"
import { Component, getUtility } from "../component/component"
import { MetadataKey } from "../bands/builder/types"

interface SlotUtilityProps extends UtilityProps {
	listName: string
	definition?: BaseDefinition
	accepts: string[]
	direction?: "VERTICAL" | "HORIZONTAL"
	label?: string
	message?: string
}

const getSlotProps = (props: SlotUtilityProps): BaseProps[] => {
	const { path, context, listName, definition } = props
	if (!definition) return []

	const listDef = (definition?.[listName] || []) as DefinitionList
	const listPath = path ? `${path}["${listName}"]` : `["${listName}"]`

	return listDef.flatMap((itemDef, index) => {
		const componentType = Object.keys(itemDef)[0]
		const unWrappedDef = itemDef[componentType]
		if (!itemDef) return []
		return {
			definition: unWrappedDef as DefinitionMap,
			componentType: componentType as MetadataKey,
			path: `${listPath}["${index}"]`,
			context,
		}
	})
}

const Slot: FunctionComponent<SlotUtilityProps> = (props) => {
	const slotWrapper = props.context.getWorkspace()?.slotwrapper
	if (slotWrapper) {
		const SlotBuilder = getUtility(slotWrapper)
		return <SlotBuilder {...props} />
	}

	return (
		<>
			{getSlotProps(props).map((props, index) => (
				<Component key={index} {...props} />
			))}
		</>
	)
}

export { SlotUtilityProps, getSlotProps }
export default Slot
