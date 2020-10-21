import React, { ReactElement } from "react"
import { DefinitionList, BaseProps } from "../definition/definition"
import { create } from "../component/component"

type SlotDefinition = {
	items: DefinitionList
}

type SlotProps = {
	definition: SlotDefinition
} & BaseProps

function SlotRuntime(props: SlotProps): ReactElement | null {
	const items = props.definition.items as DefinitionList
	const listPath = props.path
	return (
		<>
			{items
				? items.map((itemDef, index) => {
						const itemPath = `${listPath}["${index}"]`
						return create(itemDef, index, itemPath, props.context)
				  })
				: []}
		</>
	)
}

export default SlotRuntime
