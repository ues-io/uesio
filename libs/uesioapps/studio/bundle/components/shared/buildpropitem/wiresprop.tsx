import { FunctionComponent } from "react"
import { PropRendererProps } from "./proprendererdefinition"
import { hooks, wire, component } from "@uesio/ui"

const MultiSelectField = component.registry.getUtility("io.multiselectfield")

const WiresProp: FunctionComponent<PropRendererProps> = (props) => {
	const { descriptor, context, setValue, getValue } = props
	const uesio = hooks.useUesio(props)
	const wires = uesio.view.useDefinition(
		'["wires"]'
	) as wire.WireDefinitionMap

	return (
		<MultiSelectField
			value={getValue()}
			label={descriptor.label}
			setValue={setValue}
			options={Object.keys(wires).map((wireId) => ({
				value: wireId,
				label: wireId,
			}))}
			context={context}
		/>
	)
}

export default WiresProp
