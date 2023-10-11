import { definition, api, wire } from "@uesio/ui"
import CheckboxField from "../field/checkbox"
import ToggleField from "../field/toggle"

interface CheckboxFilterProps {
	path: string
	wire: wire.Wire
	condition: wire.ValueConditionState
	displayAs?: string
}

const CheckboxFilter: definition.UtilityComponent<CheckboxFilterProps> = (
	props
) => {
	const { wire, context, displayAs, condition } = props
	const wireId = wire.getId()

	return displayAs === "TOGGLE" ? (
		<ToggleField
			context={context}
			variant={"uesio/io.filter"}
			value={condition.value || ""}
			setValue={(value: boolean) => {
				api.signal.runMany(
					[
						{
							signal: "wire/SET_CONDITION",
							wire: wireId,
							condition: {
								...condition,
								value,
								inactive: !value,
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
	) : (
		<CheckboxField
			context={context}
			variant={"uesio/io.filter"}
			value={condition.value || ""}
			setValue={(value: boolean) => {
				api.signal.runMany(
					[
						{
							signal: "wire/SET_CONDITION",
							wire: wireId,
							condition: {
								...condition,
								value,
								inactive: !value,
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

export default CheckboxFilter
