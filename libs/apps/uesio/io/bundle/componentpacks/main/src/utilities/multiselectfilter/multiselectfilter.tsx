import { FunctionComponent } from "react"
import { definition, api, wire, collection, signal } from "@uesio/ui"
import MultiSelectField from "../field/multiselect"

interface MultiSelectFilterProps extends definition.UtilityProps {
	path: string
	wire: wire.Wire
	fieldMetadata: collection.Field
	condition: wire.ValueConditionState
	operator: string
}

const MultiSelectFilter: FunctionComponent<MultiSelectFilterProps> = (
	props
) => {
	const { wire, fieldMetadata, context, condition, operator } = props
	const wireId = wire.getId()
	return (
		<MultiSelectField
			fieldMetadata={fieldMetadata}
			context={context}
			options={fieldMetadata.getSelectMetadata()?.options || []}
			variant={"uesio/io.filter"}
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
										operator,
										values,
										active: !!values,
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
