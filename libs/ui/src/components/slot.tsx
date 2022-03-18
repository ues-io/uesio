import { FunctionComponent } from "react"
import {
	BaseDefinition,
	DefinitionList,
	UtilityProps,
} from "../definition/definition"
import { Component } from "../component/component"
import { unWrapDefinition } from "../component/path"
import { getUtility } from "../component/registry"

interface SlotUtilityProps extends UtilityProps {
	listName: string
	definition?: BaseDefinition
	accepts: string[]
	direction?: string
}

const SlotBuilder = getUtility("uesio/studio.slotbuilder")

const InnerSlot: FunctionComponent<SlotUtilityProps> = (props) => {
	const { path, context, listName, definition } = props
	if (!definition) return null

	const listDef = (definition?.[listName] || []) as DefinitionList
	const listPath = path ? `${path}["${listName}"]` : `["${listName}"]`

	return (
		<>
			{listDef.map((itemDef, index) => {
				const [componentType, unWrappedDef] = unWrapDefinition(itemDef)
				return (
					<Component
						key={index}
						componentType={componentType}
						definition={unWrappedDef}
						index={index}
						path={`${listPath}["${index}"]`}
						context={context}
					/>
				)
			})}
		</>
	)
}

const Slot: FunctionComponent<SlotUtilityProps> = (props) =>
	props.context.getBuildMode() ? (
		<SlotBuilder {...props}>
			<InnerSlot {...props} />
		</SlotBuilder>
	) : (
		<InnerSlot {...props} />
	)

export { SlotUtilityProps }
export default Slot
