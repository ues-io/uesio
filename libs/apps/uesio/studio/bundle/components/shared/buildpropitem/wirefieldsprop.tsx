import { FunctionComponent } from "react"
import { builder, component, wire } from "@uesio/ui"
import MultiSelectProp from "./multiselectprop"
import WireProp from "./wireprop"

const WireFieldsProp: FunctionComponent<builder.PropRendererProps> = (
	props
) => {
	const { valueAPI, path } = props
	const parentPath = component.path.getParentPath(path || "")
	const wirePath = parentPath + '["wire"]'
	const wire = valueAPI.get(wirePath)
	if (wire === "")
		return (
			<WireProp
				{...props}
				path={wirePath}
				descriptor={{
					name: "wire",
					type: "WIRE",
					label: "Wire",
				}}
			/>
		)

	const wiresDef = (valueAPI.get('["wires"][' + wire + "]") ||
		{}) as wire.WireDefinition
	const fields = wiresDef.fields ? wiresDef.fields : []

	return (
		<>
			<WireProp
				{...props}
				path={wirePath}
				descriptor={{
					name: "wire",
					type: "WIRE",
					label: "Wire",
				}}
			/>
			<MultiSelectProp
				{...props}
				descriptor={{
					name: "searchFields",
					label: "Search Fields",
					type: "MULTISELECT",
					options: Object.keys(fields).map((label) => ({
						value: label.toLowerCase(),
						label,
					})) as builder.PropertySelectOption[],
				}}
			/>
		</>
	)
}

export default WireFieldsProp
