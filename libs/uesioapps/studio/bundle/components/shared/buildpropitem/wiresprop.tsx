import { FunctionComponent } from "react"
import { wire, component, builder } from "@uesio/ui"

const MultiSelectField = component.registry.getUtility("io.multiselectfield")

const WiresProp: FunctionComponent<builder.PropRendererProps> = (props) => {
	const { descriptor, context, valueAPI, path } = props
	const selectedWires = (valueAPI.get(path) || []) as wire.WireDefinition
	const availableWires = (valueAPI.get('["wires"]') ||
		{}) as wire.WireDefinitionMap

	return (
		<MultiSelectField
			value={selectedWires}
			label={descriptor.label}
			setValue={(value: string) => valueAPI.set(path, value)}
			options={Object.keys(availableWires).map((wireId) => ({
				value: wireId,
				label: wireId,
			}))}
			context={context}
		/>
	)
}

export default WiresProp
