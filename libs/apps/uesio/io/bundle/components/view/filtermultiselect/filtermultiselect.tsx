import { FC } from "react"

import { Props } from "./filtermultiselectdefinition"
import { component, hooks, collection } from "@uesio/ui"

const SelectField = component.getUtility("uesio/io.selectfield")
const addBlankSelectOption = collection.addBlankSelectOption

const FilterMultiselect: FC<Props> = (props) => {
	const { context, definition } = props
	const { field } = definition
	const uesio = hooks.useUesio(props)
	const wire = uesio.wire.useWire(definition.wire)
	if (!wire) return null
	const collection = wire.getCollection()
	const fieldMetadata = collection.getField(String(field))
	if (!fieldMetadata) return null

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
									conditionId: props.path,
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
}

export default FilterMultiselect
