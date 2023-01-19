import DefinitionSelectorProp from "./definitionselectorprop"
import { definition } from "@uesio/ui"
import { FullPath } from "../api/path"

interface WireProps {
	label: string
	path: FullPath
}

const WireProp: definition.UtilityComponent<WireProps> = (props) => (
	<DefinitionSelectorProp
		noValueLabel="No Wire selected"
		{...props}
		definitionPath='["wires"]'
		//filter={filter}
	/>
)

export default WireProp
