import { FC } from "react"
import { builder, component, wire } from "@uesio/ui"
import SelectProp from "./selectprop"
import WireProp from "./wireprop"

const WireFieldProp: FC<builder.PropRendererProps> = (props) => {
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
				<SelectProp
					{...props}
					descriptor={{
						name: "field",
						label: "Field",
						type: "SELECT",
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

export default WireFieldProp
