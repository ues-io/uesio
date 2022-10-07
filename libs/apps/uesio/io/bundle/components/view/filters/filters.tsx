import { FunctionComponent } from "react"

import { FiltersProps } from "./filtersdefinition"
import { hooks, component, metadata } from "@uesio/ui"

// const SelectField = component.getUtility("uesio/io.selectfield")
// const CheckboxField = component.getUtility("uesio/io.checkbox")

// const addBlankSelectOption = collection.addBlankSelectOption

const Filters: FunctionComponent<FiltersProps> = (props) => {
	const { context, definition, path } = props
	const { filters } = definition
	const uesio = hooks.useUesio(props)
	const wire = uesio.wire.useWire(definition.wire)
	if (!wire) return null

	const collection = wire.getCollection()

	const components = filters.reduce((prev, { field }) => {
		const fieldType = collection.getField(field)?.getType()
		return fieldType
			? [...prev, [field, `uesio/io.filter${fieldType.toLowerCase()}`]]
			: prev
	}, [])

	const definition2 = {
		components: components.map((el) => ({ [el[1]]: {} })),
	}

	return (
		<component.Slot
			definition={definition2}
			listName="components"
			path={path}
			accepts={[]}
			context={context}
		/>
	)
}

export default Filters
// <div>
// 	{components.map(([fieldType, componentType], index) => (
// 		<component.Component
// 			key={index}
// 			componentType={componentType as metadata.MetadataKey}
// 			definition={{}}
// 			index={index}
// 			path={`${path}["components"]["${index}"]`}
// 			context={context}
// 		/>
// 	))}
// </div>
