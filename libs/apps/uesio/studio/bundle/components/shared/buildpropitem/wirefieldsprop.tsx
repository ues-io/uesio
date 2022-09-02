import { FC } from "react"
import { builder, component, wire, util } from "@uesio/ui"
import MultiSelectProp from "./multiselectprop"

const WireFieldsProp: FC<builder.PropRendererProps> = (props) => {
	const { valueAPI, path } = props
	const parentPath = component.path.getParentPath(path || "")
	const wirePath = parentPath + '["wire"]'
	const wireId = valueAPI.get(wirePath)
	const wireDef = (valueAPI.get('["wires"][' + wireId + "]") ||
		{}) as wire.WireDefinition
	const options = util.getWireFieldSelectOptions(wireDef) || []

	return (
		<MultiSelectProp
			{...props}
			descriptor={{
				name: "searchFields",
				label: "Fields",
				type: "MULTISELECT",
				options: [
					...(!wireId
						? [
								{
									disabled: true,
									label: "Select a wire first",
									value: "",
								},
						  ]
						: []),
					...options,
				],
			}}
		/>
	)
}

export default WireFieldsProp
