import { builder, wire, util, component } from "@uesio/ui"

import SelectProp from "./selectprop"

const FieldsProp: builder.PropComponent<builder.FieldProp> = (props) => {
	const { valueAPI, descriptor, path } = props

	const wirePath = component.path.createRelativePath(
		descriptor.wireField,
		path || ""
	)
	const wireId = valueAPI.get(wirePath)
	const wireDef = (valueAPI.get('["wires"][' + wireId + "]") ||
		{}) as wire.WireDefinition

	const options = util.getWireFieldSelectOptions(wireDef) || []
	const getOptionsLabel = () => {
		if (!wireId) return "Select a wire first"
		if (!options.length) return `No fields in ${wireId}`
		return "Select a field"
	}

	if (!descriptor.wireField) return null

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
