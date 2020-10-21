import { ReactElement } from "react"
import { BaseProps, DefinitionMap } from "../definition/definition"
import { createComponent } from "../component/component"

interface SlotProps extends BaseProps {
	listName: string
	accepts: string[]
	direction?: string
}

function Slot(props: SlotProps): ReactElement | null {
	const definition = props.definition as DefinitionMap
	const listName = props.listName
	const path = props.path
	if (!props.definition) {
		return null
	}
	const listDef = definition[listName]
	const listPath = path ? `${path}["${listName}"]` : `["${listName}"]`
	return createComponent(
		"uesio",
		"slot",
		{
			items: listDef,
			accepts: props.accepts,
			direction: props.direction,
		},
		0,
		listPath,
		props.context
	)
}

export default Slot
