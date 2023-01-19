import DefinitionSelectorProp from "./definitionselectorprop"
import { wire, definition } from "@uesio/ui"
import { FullPath } from "../api/path"

interface ConditionProps {
	label: string
	path: FullPath
}

const ConditionPropComponent: definition.UtilityComponent<ConditionProps> = (
	props
) => (
	<DefinitionSelectorProp
		{...props}
		noValueLabel="No Condition selected"
		//filter={filter}
		definitionPath={`["wires"]["${wire}"]["conditions"]`}
		valueGrabber={(def: wire.WireConditionState) => def.id}
		labelGrabber={(def: wire.WireConditionState) => def.id}
	/>
)

export default ConditionPropComponent
