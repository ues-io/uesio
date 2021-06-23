import { FunctionComponent } from "react"
import { PropRendererProps } from "./proprendererdefinition"
import DefinitionSelectorProp from "./definitionselectorprop"

const WireProp: FunctionComponent<PropRendererProps> = (props) => {
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
