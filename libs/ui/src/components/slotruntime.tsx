import { FunctionComponent } from "react"
import { DefinitionList, BaseProps } from "../definition/definition"
import { Component } from "../component/component"
import { unWrapDefinition } from "../component/path"

type SlotDefinition = {
	items: DefinitionList
}

type SlotProps = {
	definition: SlotDefinition
} & BaseProps

const SlotRuntime: FunctionComponent<SlotProps> = (props) => {
	const items = props.definition.items
	const listPath = props.path
	return (
		<>
			{items?.map((itemDef, index) => {
				const [componentType, unWrappedDef] = unWrapDefinition(itemDef)
				return (
					<Component
						key={index}
						componentType={componentType}
						definition={unWrappedDef}
						index={index}
						path={`${listPath}["${index}"]`}
						context={props.context}
					/>
				)
			}) || []}
		</>
	)
}

export default SlotRuntime
