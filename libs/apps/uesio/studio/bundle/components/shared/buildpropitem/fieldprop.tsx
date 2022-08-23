import { FC } from "react"
import { builder, component, wire, util } from "@uesio/ui"
import SelectProp from "./selectprop"

const FieldsProp: FC<builder.PropRendererProps> = (props) => {
	const { valueAPI, path } = props
	const descriptor = props.descriptor as builder.FieldProp
	const parentPath = component.path.getParentPath(path || "")
	const wirePath = parentPath + `["${descriptor.wireField}"]`
	const wireId = valueAPI.get(wirePath)

	const wireDef = (valueAPI.get(
		'["wires"][' + valueAPI.get(wirePath) + "]"
	) || {}) as wire.WireDefinition

	return (
		<SelectProp
			{...props}
			descriptor={{
				...descriptor,
				type: "SELECT",
				options: [
					{
						label: wireId
							? "Select a field"
							: "Select a wire first",
						value: "",
					},
					...(util.getWireFieldSelectOptions(wireDef) || []),
				],
			}}
		/>
	)
}

export default FieldsProp
