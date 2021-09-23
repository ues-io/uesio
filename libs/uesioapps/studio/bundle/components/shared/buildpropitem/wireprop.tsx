import { FunctionComponent } from "react"
import DefinitionSelectorProp from "./definitionselectorprop"
import { builder } from "@uesio/ui"

const WireProp: FunctionComponent<builder.PropRendererProps> = (props) => {
	if (props.descriptor.type !== "WIRE") {
		return null
	}
	return (
		<DefinitionSelectorProp
			noValueLabel="No Wire selected"
			{...props}
			definitionPath='["wires"]'
			filter={props.descriptor.filter}
		/>
	)
}

export default WireProp
