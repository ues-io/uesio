import { FC } from "react"

import { Props } from "./filternumberdefinition"
// import { hooks } from "@uesio/ui"

const Filter: FC<Props> = (props) => {
	const { definition } = props
	const { fieldId } = definition
	// const uesio = hooks.useUesio(props)
	// // const wire = uesio.wire.useWire(definition.wire)
	// if (!wire) return null

	// const collection = wire.getCollection()

	const fieldMetadata = collection.getField(fieldId)

	if (!fieldMetadata) return null

	return <p>filter number 2</p>
}

export default Filter
