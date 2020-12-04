import React, { ReactElement } from "react"
import { BaseProps, DefinitionMap } from "../definition/definition"
import { ComponentInternal } from "../component/component"

interface SlotProps extends BaseProps {
	listName: string
	accepts: string[]
	direction?: string
}

function Slot(props: SlotProps): ReactElement | null {
	const definition = props.definition
	if (!props.definition) return null
	const { path, context, listName } = props
	const listDef = definition?.[listName]
	const listPath = path ? `${path}["${listName}"]` : `["${listName}"]`
	return (
		<ComponentInternal
			componentType="uesio.slot"
			definition={{
				items: listDef,
				accepts: props.accepts,
				direction: props.direction,
			}}
			path={listPath}
			context={context}
		/>
	)
}

export default Slot
