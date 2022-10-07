import { FunctionComponent } from "react"

import { FilterProps } from "./filterdefinition"
import { hooks } from "@uesio/ui"

const Filter: FunctionComponent<FilterProps> = (props) => {
	const { definition } = props
	if (!definition) return null
	const { fieldId } = definition
	const uesio = hooks.useUesio(props)
	const wire = uesio.wire.useWire(definition.wire)
	if (!wire) return null

	const collection = wire.getCollection()

	const fieldMetadata = collection.getField(fieldId)

	if (!fieldMetadata) return null

	// const type = fieldMetadata.getType

	return (
		<div>
			<p>filter</p>
		</div>
	)
}

export default Filter
