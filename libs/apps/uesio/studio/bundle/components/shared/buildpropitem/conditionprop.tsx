import { FunctionComponent } from "react"
import DefinitionSelectorProp from "./definitionselectorprop"
import { wire, builder } from "@uesio/ui"

const ConditionPropComponent: FunctionComponent<builder.PropRendererProps> = (
	props
) => {
	const descriptor = props.descriptor
	if (descriptor.type !== "CONDITION") return null
	const wireId = descriptor.wire
	if (!wireId) {
		return null
	}
	return (
		<DefinitionSelectorProp
			noValueLabel="No Condition selected"
			{...props}
			filter={descriptor.filter}
			definitionPath={`["wires"]["${wireId}"]["conditions"]`}
			valueGrabber={(def: wire.WireConditionDefinition) => def.id}
			labelGrabber={(def: wire.WireConditionDefinition) => def.id}
		/>
	)
}

export default ConditionPropComponent
