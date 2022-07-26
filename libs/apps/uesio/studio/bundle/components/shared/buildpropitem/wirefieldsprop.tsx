import { FC } from "react"
import { builder, component, wire } from "@uesio/ui"
import MultiSelectProp from "./multiselectprop"
import WireProp from "./wireprop"

const WireFieldsProp: FC<builder.PropRendererProps> = (props) => {
	const { valueAPI, path } = props
	const parentPath = component.path.getParentPath(path || "")
	const wirePath = parentPath + '["wire"]'
	const wireId = valueAPI.get(wirePath)

	const wiresDef = (valueAPI.get('["wires"][' + wireId + "]") ||
		{}) as wire.WireDefinition
	const fields = wiresDef.fields || {}

	return (
		<div
			style={{
				borderTop: "1px solid #eee",
				borderBottom: "1px solid #eee",
			}}
		>
			<WireProp
				{...props}
				path={wirePath}
				descriptor={{
					name: "wire",
					type: "WIRE",
					label: "Wire",
				}}
			/>
			{wireId && (
				<MultiSelectProp
					{...props}
					descriptor={{
						name: "searchFields",
						label: "Search Fields",
						type: "MULTISELECT",
						options: Object.keys(fields).map((label) => ({
							value: label.toLowerCase(),
							label,
						})),
					}}
				/>
			)}
		</div>
	)
}

export default WireFieldsProp
