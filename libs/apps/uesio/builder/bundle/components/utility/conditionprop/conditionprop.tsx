import DefinitionSelectorProp from "../definitionselectorprop/definitionselectorprop"
import { wire, builder, component } from "@uesio/ui"

const ConditionPropComponent: builder.PropComponent<builder.ConditionProp> = (
	props
) => {
	const {
		valueAPI,
		path,
		descriptor: { filter, wireField },
	} = props

	const wirePath = component.path.parseRelativePath(wireField, path || "")
	const wireId = valueAPI.get(wirePath)

	return (
		<DefinitionSelectorProp
			noValueLabel="No Condition selected"
			{...props}
			filter={filter}
			definitionPath={`["wires"]["${wireId}"]["conditions"]`}
			valueGrabber={(def: wire.WireConditionState) => def.id}
			labelGrabber={(def: wire.WireConditionState) => def.id}
		/>
	)
}

export default ConditionPropComponent
