import { FunctionComponent } from "react"
import { definition, api, wire } from "@uesio/ui"
import ToggleField from "../field/toggle"

export interface GroupFilterProps extends definition.UtilityProps {
	path: string
	wire: wire.Wire
	condition: wire.ValueConditionState
}

const GroupFilter: FunctionComponent<GroupFilterProps> = (props) => {
	const { wire, context, condition } = props
	const wireId = wire.getId()

	return (
		<ToggleField
			context={context}
			variant={"uesio/io.filter"}
			value={condition.inactive} //TO-DO
			setValue={() => {
				api.signal.runMany(
					[
						{
							signal: "wire/TOGGLE_CONDITION",
							wire: wireId,
							conditionId: condition.id,
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

export default GroupFilter
