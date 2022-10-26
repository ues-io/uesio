import { FC } from "react"

import { Props } from "./filtermultiselectdefinition"
import { component, hooks, collection, wire } from "@uesio/ui"

import { SelectFieldProps } from "../../utility/multiselectfield/multiselectfield"
const MultiSelectField = component.getUtility<SelectFieldProps>(
	"uesio/io.multiselectfield"
)

const addBlankSelectOption = collection.addBlankSelectOption

const FilterMultiselect: FC<Props> = (props) => {
	const { context, definition, path = "" } = props
	const { field } = definition
	const uesio = hooks.useUesio(props)
	const wire = uesio.wire.useWire(definition.wire)

	if (!wire) return null
	const collection = wire.getCollection()
	const fieldMetadata = collection.getField(String(field))

	if (!fieldMetadata) return null
	const conditionState = wire.getCondition(
		path
	) as wire.ValueConditionState | null
	const value = (conditionState?.value || []) as string[]
	const operator = definition.operator

	return (
		<>
			<MultiSelectField
				value={value as string[]}
				fieldMetadata={fieldMetadata}
				context={context}
				options={addBlankSelectOption(
					fieldMetadata.getSelectMetadata()?.options || [],
					"Any " + fieldMetadata.getLabel()
				)}
				variant={"uesio/io.filter"}
				setValue={(value: string[]) => {
					uesio.signal.runMany(
						[
							value && value[0] !== ""
								? {
										signal: "wire/SET_CONDITION",
										wire: wire.getId(),
										condition: {
											id: props.path,
											field: fieldMetadata.getId(),
											operator,
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
		</>
	)
}

export default FilterMultiselect
