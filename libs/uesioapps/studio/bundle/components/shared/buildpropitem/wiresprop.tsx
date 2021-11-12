import { FunctionComponent } from "react"
import { wire, component, builder } from "@uesio/ui"

const MultiSelectField = component.registry.getUtility("io.multiselectfield")
const FieldWrapper = component.registry.getUtility("io.fieldwrapper")

const WiresProp: FunctionComponent<builder.PropRendererProps> = (props) => {
	const { descriptor, context, valueAPI, path } = props
	const selectedWires = (valueAPI.get(path) || []) as wire.WireDefinition
	const availableWires = (valueAPI.get('["wires"]') ||
		{}) as wire.WireDefinitionMap

	return (
		<FieldWrapper label={descriptor.label} context={context}>
			<MultiSelectField
				value={selectedWires}
				setValue={(value: string) => valueAPI.set(path, value)}
				options={Object.keys(availableWires).map((wireId) => ({
					value: wireId,
					label: wireId,
				}))}
				context={context}
			/>
		</FieldWrapper>
	)
}

export default WiresProp
