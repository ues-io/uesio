import { FunctionComponent } from "react"
import { builder } from "@uesio/ui"
import DefinitionSelectorProp from "./definitionselectorprop"

const ParamProp: FunctionComponent<builder.PropRendererProps> = (props) => {
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
