import React, { FunctionComponent } from "react"
import { BaseProps, DefinitionMap } from "../definition/definition"
import { ComponentInternal } from "../component/component"

interface SlotProps extends BaseProps {
	listName: string
	accepts: string[]
	direction?: string
}

const Slot: FunctionComponent<SlotProps> = (props) => {
	const { path, context, listName, definition, accepts, direction } = props
	if (!definition) {
		return null
	}

	const listDef = definition?.[listName]
	const listPath = path ? `${path}["${listName}"]` : `["${listName}"]`
	return (
		<ComponentInternal
			componentType="uesio.slot"
			definition={{
				items: listDef,
				accepts,
				direction,
			}}
			path={listPath}
			context={context}
		/>
	)
}

export default Slot
