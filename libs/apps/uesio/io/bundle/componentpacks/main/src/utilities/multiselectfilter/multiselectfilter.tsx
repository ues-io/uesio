import { definition, api, wire, collection, signal } from "@uesio/ui"
import MultiSelectField from "../field/multiselect"

interface MultiSelectFilterProps {
	path: string
	wire: wire.Wire
	fieldMetadata: collection.Field
	condition: wire.ValueConditionState
}

const MultiSelectFilter: definition.UtilityComponent<MultiSelectFilterProps> = (
	props
) => {
	const { wire, fieldMetadata, context, condition } = props
	const wireId = wire.getId()
	return (
		<MultiSelectField
			fieldMetadata={fieldMetadata}
			context={context}
			options={
				fieldMetadata.getSelectOptions({
					addBlankOption: false,
					context,
				}) || []
			}
			value={Array.isArray(condition.values) ? condition.values : []}
			setValue={(values: string[]) => {
				const signals = (
					!values || values.length === 0
						? [
								{
									signal: "wire/REMOVE_CONDITION",
									wire: wireId,
									conditionId: condition.id,
								},
						  ]
						: [
								{
									signal: "wire/SET_CONDITION",
									wire: wireId,
									condition: {
										...condition,
										values,
										inactive: !values,
									},
								},
						  ]
				) as signal.SignalDefinition[]
				signals.push({
					signal: "wire/LOAD",
					wires: [wireId],
				})
				api.signal.runMany(signals, context)
			}}
		/>
	)
}

export default MultiSelectFilter
