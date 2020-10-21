import React, { ReactElement } from "react"
import { PropRendererProps } from "./proprendererdefinition"
import { hooks, wire } from "@uesio/ui"
import SelectProp from "./selectprop"

function WireProp(props: PropRendererProps): ReactElement | null {
	const uesio = hooks.useUesio(props)
	const wires = uesio.view.useDefinition(
		`["wires"]`
	) as wire.WireDefinitionMap

	const rendererProps = {
		...props,
		descriptor: {
			...props.descriptor,
			options: Object.keys(wires).map((wireId) => {
				return {
					value: wireId,
					label: wireId,
				}
			}),
		},
	}

	return <SelectProp {...rendererProps}></SelectProp>
}

export default WireProp
