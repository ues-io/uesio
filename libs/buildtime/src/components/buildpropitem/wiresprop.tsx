import React, { ReactElement } from "react"
import { PropRendererProps } from "./proprendererdefinition"
import { hooks, wire } from "@uesio/ui"
import MultiSelectProp from "./multiselectprop"

function WiresProp(props: PropRendererProps): ReactElement | null {
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

	return <MultiSelectProp {...rendererProps}></MultiSelectProp>
}

export default WiresProp
