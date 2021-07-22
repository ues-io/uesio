import { FunctionComponent } from "react"
import { PropRendererProps } from "./proprendererdefinition"
import { hooks, wire, component } from "@uesio/ui"

const MultiSelectField = component.registry.getUtility("io.multiselectfield")

const WiresProp: FunctionComponent<PropRendererProps> = (props) => {
	const { descriptor, context, valueAPI, path } = props
	const wires = valueAPI.get(path) as wire.WireDefinitionMap

	return (
		<MultiSelectField
			value={wires}
			label={descriptor.label}
			setValue={(value: string) => valueAPI.set(path, value)}
			options={Object.keys(wires).map((wireId) => ({
				value: wireId,
				label: wireId,
			}))}
			context={context}
		/>
	)
}

export default WiresProp
