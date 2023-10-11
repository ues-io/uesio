import { definition, api, wire, collection } from "@uesio/ui"
import NumberField from "../field/number"

interface NumberFilterProps {
	path: string
	wire: wire.Wire
	fieldMetadata: collection.Field
	condition: wire.ValueConditionState
}

const NumberFilter: definition.UtilityComponent<NumberFilterProps> = (
	props
) => {
	const { wire, fieldMetadata, context, condition } = props
	const wireId = wire.getId()

	return (
		<NumberField
			fieldMetadata={fieldMetadata}
			context={context}
			variant={"uesio/io.filter"}
			value={condition.value}
			setValue={(value: string) => {
				api.signal.runMany(
					[
						{
							signal: "wire/SET_CONDITION",
							wire: wireId,
							condition: {
								...condition,
								value,
								inactive: value === null,
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

export default NumberFilter
