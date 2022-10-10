import { builder } from "@uesio/ui"
import DefinitionSelectorProp from "./definitionselectorprop"

const ParamProp: builder.PropComponent<builder.ParamProp> = (props) => {
	if (props.descriptor.type !== "PARAM") {
		return null
	}
	return (
		<DefinitionSelectorProp
			noValueLabel="No Param selected"
			{...props}
			definitionPath='["params"]'
			filter={props.descriptor.filter}
		/>
	)
}

export default ParamProp
