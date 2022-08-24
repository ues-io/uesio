import DefinitionSelectorProp from "./definitionselectorprop"
import { builder } from "@uesio/ui"

const WireProp: builder.PropComponent<builder.WireProp> = (props) => (
	<DefinitionSelectorProp
		noValueLabel="No Wire selected"
		{...props}
		definitionPath='["wires"]'
		filter={props.descriptor.filter}
	/>
)

export default WireProp
