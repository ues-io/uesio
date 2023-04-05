import { FunctionComponent } from "react"
import { definition, api, wire, collection } from "@uesio/ui"
import ToggleField from "../field/toggle"

interface GroupFilterProps extends definition.UtilityProps {
	path: string
	wire: wire.Wire
	fieldMetadata: collection.Field
	condition: wire.ValueConditionState
}

const GroupFilter: FunctionComponent<GroupFilterProps> = (props) => {
	const { wire, fieldMetadata, context, condition } = props
	const wireId = wire.getId()

	return (
		<ToggleField
			fieldMetadata={fieldMetadata}
			context={context}
			variant={"uesio/io.filter"}
			value={condition.active}
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
