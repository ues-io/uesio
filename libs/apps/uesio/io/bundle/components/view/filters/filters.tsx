import { FunctionComponent } from "react"

import { FiltersProps } from "./filtersdefinition"
import { hooks } from "@uesio/ui"

// const SelectField = component.getUtility("uesio/io.selectfield")
// const CheckboxField = component.getUtility("uesio/io.checkbox")

// const addBlankSelectOption = collection.addBlankSelectOption

const Filters: FunctionComponent<FiltersProps> = (props) => {
	const { definition } = props
	const { fieldId } = definition
	const uesio = hooks.useUesio(props)
	const wire = uesio.wire.useWire(definition.wire)
	if (!wire) return null

	const collection = wire.getCollection()

	const fieldMetadata = collection.getField(fieldId)

	if (!fieldMetadata) return null

	// const type = fieldMetadata.getType()
	return <h1>filters</h1>
}

export default Filters
