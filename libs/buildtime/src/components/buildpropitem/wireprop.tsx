import { FunctionComponent } from "react"
import { PropRendererProps } from "./proprendererdefinition"
import { hooks, wire } from "@uesio/ui"
import SelectProp from "./selectprop"

const WireProp: FunctionComponent<PropRendererProps> = (props) => {
	const uesio = hooks.useUesio(props)
	const descriptor = props.descriptor
	const wires = uesio.view.useDefinition(
		'["wires"]'
	) as wire.WireDefinitionMap

	if (!wires) return null

	return (
		<SelectProp
			{...props}
			descriptor={{
				...descriptor,
				type: "SELECT",
				options: Object.keys(wires).map((wireId) => ({
					value: wireId,
					label: wireId,
				})),
			}}
		/>
	)
}

export default WireProp
