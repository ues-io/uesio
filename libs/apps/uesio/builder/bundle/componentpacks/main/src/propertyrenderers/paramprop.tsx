import { definition } from "@uesio/ui"
import { FullPath } from "../api/path"
import DefinitionSelectorProp from "./definitionselectorprop"

interface ParamProps {
	label: string
	path: FullPath
}

const ParamProp: definition.UtilityComponent<ParamProps> = (props) => (
	<DefinitionSelectorProp
		{...props}
		noValueLabel="No Param selected"
		definitionPath='["params"]'
		//filter={props.descriptor.filter}
	/>
)

export default ParamProp
