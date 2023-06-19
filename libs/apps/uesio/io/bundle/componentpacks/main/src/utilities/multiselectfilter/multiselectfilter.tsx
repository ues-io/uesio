import { FunctionComponent } from "react"
import { definition, api, wire, collection } from "@uesio/ui"
import MultiSelectField from "../field/multiselect"

interface MultiSelectFilterProps extends definition.UtilityProps {
	path: string
	wire: wire.Wire
	fieldMetadata: collection.Field
	condition: wire.ValueConditionState
}

const MultiSelectFilter: FunctionComponent<MultiSelectFilterProps> = (
	props
) => {
	const { wire, fieldMetadata, context, condition } = props
	const wireId = wire.getId()
	return (
		<MultiSelectField
			fieldMetadata={fieldMetadata}
			context={context}
			options={fieldMetadata.getSelectMetadata()?.options || []}
			variant={"uesio/io.filter"}
			value={Array.isArray(condition.value) ? condition.value : []}
			setValue={(value: string[]) => {
				const signals =
					value && value.length === 0
						? [
								{
									signal: "wire/REMOVE_CONDITION",
									wire: wireId,
									conditionId: condition.id,
								},
								{
									signal: "wire/LOAD",
									wires: [wireId],
								},
						  ]
						: [
								{
									signal: "wire/SET_CONDITION",
									wire: wireId,
									condition: {
										...condition,
										values: value,
										active: !!value,
									},
								},
								{
									signal: "wire/LOAD",
									wires: [wireId],
								},
						  ]

				api.signal.runMany(signals, context)
			}}
		/>
	)
}

export default MultiSelectFilter
