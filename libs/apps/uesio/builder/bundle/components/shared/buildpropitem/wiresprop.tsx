import { wire, builder } from "@uesio/ui"
import MultiSelectProp from "./multiselectprop"

const WiresProp: builder.PropComponent<builder.WiresProp> = (props) => {
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
				type: "MULTISELECT",
			}}
		/>
	)
}

export default WiresProp
