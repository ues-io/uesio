import DefinitionSelectorProp from "../definitionselectorprop/definitionselectorprop"
import { wire, builder } from "@uesio/ui"

const ConditionPropComponent: builder.PropComponent<builder.ConditionProp> = (
	props
) => {
	const {
		descriptor: { filter, wire },
	} = props

	return (
		<DefinitionSelectorProp
			noValueLabel="No Condition selected"
			{...props}
			filter={filter}
			definitionPath={`["wires"]["${wire}"]["conditions"]`}
			valueGrabber={(def: wire.WireConditionState) => def.id}
			labelGrabber={(def: wire.WireConditionState) => def.id}
		/>
	)
}

export default ConditionPropComponent
