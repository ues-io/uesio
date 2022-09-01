import { builder, wire, util, component } from "@uesio/ui"

import SelectProp from "./selectprop"

const getWirePath = (str: string, path: string) => {
	// Clean strings starting with './', we don't need that
	const niceString = str.startsWith("./") ? str.replace("./", "") : str
	// get the N levels up the tree
	const arr = niceString.split("../")

	const startingPath = component.path.trim(path, arr.length - 1)
	const endingPath = arr
		.pop()
		?.split("/")
		.map((el) => `["${el}"]`)
		.join("")

	return startingPath + endingPath
}

const FieldsProp: builder.PropComponent<builder.FieldProp> = (props) => {
	const { valueAPI, descriptor, path } = props

	const wirePath = getWirePath(descriptor.wireField, path || "")
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
