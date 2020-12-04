import React, { ReactElement } from "react"
import { DefinitionList, BaseProps } from "../definition/definition"
import { Component } from "../component/component"
import { unWrapDefinition } from "../component/path"

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
						const [componentType, unWrappedDef] = unWrapDefinition(
							itemDef
						)
						return (
							<Component
								componentType={componentType}
								definition={unWrappedDef}
								index={index}
								path={`${listPath}["${index}"]`}
								context={props.context}
							/>
						)
				  })
				: []}
		</>
	)
}

export default SlotRuntime
