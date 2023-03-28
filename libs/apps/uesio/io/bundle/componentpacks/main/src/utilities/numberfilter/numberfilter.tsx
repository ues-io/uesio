import { FunctionComponent } from "react"
import { definition, api, wire, collection } from "@uesio/ui"
import NumberField from "../field/number"

interface NumberFilterProps extends definition.UtilityProps {
	path: string
	wire: wire.Wire
	fieldMetadata: collection.Field
	conditionId: string | undefined
}

const NumberFilter: FunctionComponent<NumberFilterProps> = (props) => {
	const { wire, fieldMetadata, context } = props

	const conditionId = props.conditionId || props.path || ""
	const wireId = wire.getId()

	const condition = (wire.getCondition(conditionId) || {
		id: conditionId,
		field: fieldMetadata.getId(),
	}) as wire.ValueConditionState

	return (
		<NumberField
			fieldMetadata={fieldMetadata}
			context={context}
			variant={"uesio/io.filter"}
			value={condition.value || ""}
			setValue={(value: string) => {
				api.signal.runMany(
					[
						{
							signal: "wire/SET_CONDITION",
							wire: wireId,
							condition: {
								...condition,
								value,
								active: !!value,
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
