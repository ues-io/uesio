import React, { FunctionComponent } from "react"
import { PropRendererProps } from "./proprendererdefinition"
import { hooks, wire } from "@uesio/ui"
import SelectProp from "./selectprop"

const WireProp: FunctionComponent<PropRendererProps> = (props) => {
	const uesio = hooks.useUesio(props)
	const wires = uesio.view.useDefinition(
		`["wires"]`
	) as wire.WireDefinitionMap

	return (
		<SelectProp
			{...props}
			descriptor={{
				...props.descriptor,
				options: Object.keys(wires).map((wireId) => ({
					value: wireId,
					label: wireId,
				})),
			}}
		/>
	)
}

export default WireProp
