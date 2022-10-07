import { FC } from "react"

import { Props } from "./filternumberdefinition"
import { component } from "@uesio/ui"
const NumberField = component.getUtility("uesio/io.numberfield")

const Filter: FC<Props> = (props) => {
	const { context, definition } = props
	// const { fieldId } = definition
	// const uesio = hooks.useUesio(props)
	// // const wire = uesio.wire.useWire(definition.wire)
	// if (!wire) return null

	// const collection = wire.getCollection()

	// const fieldMetadata = collection.getField(fieldId)

	// if (!fieldMetadata) return null

	return (
		<div>
			{definition.input && (
				<NumberField
					value={50}
					setValue={(value: number | null): void =>
						console.log("setting", value)
					}
					context={context}
					variant="uesio/io.textfield:uesio/studio.propfield"
				/>
			)}
			{definition.input && definition.point === "range" && (
				<NumberField
					value={200}
					setValue={(value: number | null): void =>
						console.log("setting outer buond", value)
					}
					context={context}
					variant="uesio/io.textfield:uesio/studio.propfield"
				/>
			)}
		</div>
	)
}

export default Filter
