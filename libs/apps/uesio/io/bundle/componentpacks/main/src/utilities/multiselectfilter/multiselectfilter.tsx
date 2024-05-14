import { definition, api, wire, collection } from "@uesio/ui"
import MultiSelectField from "../field/multiselect"

interface MultiSelectFilterProps {
	path: string
	wire: wire.Wire
	fieldMetadata: collection.Field
	condition: wire.ValueConditionState
}

const removeNullValue = (values: wire.PlainFieldValue[]) =>
	values.filter((val) => val !== null)

const addNullValue = (values: wire.PlainFieldValue[]) => {
	const hasEmptyStringValue = values.find((val) => val === "") === ""
	return values.concat(hasEmptyStringValue ? [null] : [])
}

const MultiSelectFilter: definition.UtilityComponent<MultiSelectFilterProps> = (
	props
) => {
	const { wire, fieldMetadata, context, condition, variant } = props
	const wireId = wire.getId()
	return (
		<MultiSelectField
			fieldMetadata={fieldMetadata}
			variant={variant}
			context={context}
			placeholder={"Any " + fieldMetadata.getLabel()}
			options={
				fieldMetadata.getSelectOptions({
					addBlankOption: true,
					context,
				}) || []
			}
			value={
				Array.isArray(condition.values)
					? removeNullValue(condition.values)
					: []
			}
			setValue={(values: wire.PlainFieldValue[]) => {
				api.signal.runMany(
					[
						!values || values.length === 0
							? {
									signal: "wire/REMOVE_CONDITION",
									wire: wireId,
									conditionId: condition.id,
								}
							: {
									signal: "wire/SET_CONDITION",
									wire: wireId,
									condition: {
										...condition,
										values: addNullValue(values),
										inactive: false,
									},
								},
						{
							signal: "wire/LOAD",
							wires: [wireId],
						},
					],
					context
				)
			}}
		/>
	)
}

export default MultiSelectFilter
