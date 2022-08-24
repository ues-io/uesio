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

	const options = util.getWireFieldSelectOptions(wireDef) || []
	const getOptionsLabel = () => {
		if (!wireId) return "Select a wire first"
		if (!options.length) return `No fields in ${wireId}`
		return "Select a field"
	}

	return (
		<SelectProp
			{...props}
			descriptor={{
				...descriptor,
				type: "SELECT",
				options: [
					{
						label: getOptionsLabel(),
						value: "",
					},
					...options,
				],
			}}
		/>
	)
}

export default FieldsProp
