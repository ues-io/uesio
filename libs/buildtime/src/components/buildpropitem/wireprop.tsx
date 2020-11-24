import React, { ReactElement } from "react"
import { PropRendererProps } from "./proprendererdefinition"
import { hooks, wire } from "@uesio/ui"
import SelectProp from "./selectprop"

function WireProp(props: PropRendererProps): ReactElement | null {
	const uesio = hooks.useUesio(props)
	const descriptor = props.descriptor
	const wires = uesio.view.useDefinition(
		`["wires"]`
	) as wire.WireDefinitionMap

	return (
		<SelectProp
			{...props}
			descriptor={{
				...descriptor,
				type: "SELECT",
				options: Object.keys(wires).map((wireId) => {
					return {
						value: wireId,
						label: wireId,
					}
				}),
			}}
		/>
	)
}

export default WireProp
