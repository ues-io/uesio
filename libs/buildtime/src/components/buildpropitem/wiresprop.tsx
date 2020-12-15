import React, { FunctionComponent } from "react"
import { PropRendererProps } from "./proprendererdefinition"
import { hooks, wire } from "@uesio/ui"
import MultiSelectProp from "./multiselectprop"

const WiresProp: FunctionComponent<PropRendererProps> = (props) => {
	const uesio = hooks.useUesio(props)
	const wires = uesio.view.useDefinition(
		'["wires"]'
	) as wire.WireDefinitionMap

	return (
		<MultiSelectProp
			{...props}
			descriptor={{
				...props.descriptor,
				type: "MULTISELECT",
				options: Object.keys(wires).map((wireId) => ({
					value: wireId,
					label: wireId,
				})),
			}}
		/>
	)
}

export default WiresProp
