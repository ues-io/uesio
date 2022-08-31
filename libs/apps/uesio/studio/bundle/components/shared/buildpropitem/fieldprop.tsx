import { builder, wire, util } from "@uesio/ui"

import SelectProp from "./selectprop"

const FieldsProp: builder.PropComponent<builder.FieldProp> = (props) => {
	const { valueAPI, descriptor } = props

	const wireId = (descriptor as any).getLookups().wire
	const wireDef = (valueAPI.get('["wires"][' + wireId + "]") ||
		{}) as wire.WireDefinition

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
