import { FunctionComponent } from "react"

import { FilterProps } from "./filterdefinition"
import { component, collection, hooks } from "@uesio/ui"

const SelectField = component.getUtility("uesio/io.selectfield")

const addBlankSelectOption = collection.addBlankSelectOption

const Filter: FunctionComponent<FilterProps> = (props) => {
	const { context, definition } = props
	const { fieldId } = definition
	const uesio = hooks.useUesio(props)
	const wire = uesio.wire.useWire(definition.wire)
	if (!wire) return null

	const collection = wire.getCollection()

	const fieldMetadata = collection.getField(fieldId)

	if (!fieldMetadata) return null

	const type = fieldMetadata.getType()

	switch (true) {
		case type === "SELECT":
			return (
				<SelectField
					context={context}
					options={addBlankSelectOption(
						fieldMetadata.getSelectMetadata()?.options || [],
						"Any " + fieldMetadata.getLabel()
					)}
					variant={"uesio/io.filter"}
					setValue={(value: string) => {
						uesio.signal.runMany(
							[
								value
									? {
											signal: "wire/SET_CONDITION",
											wire: wire.getId(),
											condition: {
												id: props.path,
												field: fieldMetadata.getId(),
												value,
												active: true,
											},
									  }
									: {
											signal: "wire/REMOVE_CONDITION",
											wire: wire.getId(),
											condition: props.path,
									  },
								{
									signal: "wire/LOAD",
									wires: [wire.getId()],
								},
							],
							context
						)
					}}
				/>
			)
		default:
			return null
	}
}

export default Filter
