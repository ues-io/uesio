import { FunctionComponent } from "react"
import { wire, builder } from "@uesio/ui"
import MultiSelectProp from "./multiselectprop"

const WiresProp: FunctionComponent<builder.PropRendererProps> = (props) => {
	const { descriptor, valueAPI } = props
	const availableWires = (valueAPI.get('["wires"]') ||
		{}) as wire.WireDefinitionMap

	return (
		<MultiSelectProp
			{...props}
			descriptor={{
				...descriptor,
				options: Object.keys(availableWires).map((wireId) => ({
					value: wireId,
					label: wireId,
				})),
				type: "SELECT",
			}}
		/>
	)
}

export default WiresProp
