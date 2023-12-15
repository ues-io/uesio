import { definition, api, wire, collection } from "@uesio/ui"
import SelectField from "../field/select"

interface CheckboxFilterProps {
	path: string
	wire: wire.Wire
	condition: wire.ValueConditionState
	fieldMetadata: collection.Field
}

const CheckboxFilter: definition.UtilityComponent<CheckboxFilterProps> = (
	props
) => {
	const { wire, context, condition } = props
	const wireId = wire.getId()

	return (
		<SelectField
			context={context}
			options={[
				{ label: "Any", value: "" },
				{ label: "Not Set", value: "null" },
				{ label: "True", value: "true" },
				{ label: "False", value: "false" },
			]}
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
								operator: value === "null" ? "IS_BLANK" : "EQ",
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
