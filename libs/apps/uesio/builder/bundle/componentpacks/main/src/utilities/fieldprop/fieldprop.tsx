import { definition } from "@uesio/ui"

const FieldProp: definition.UtilityComponent = () => {
	console.log("not implemented")
	return null
	/*
	const { path, descriptor } = props

	const wirePath = component.path.parseRelativePath(
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
			options={[
				{
					label: getOptionsLabel(),
					value: "",
				},
				...options,
			]}
		/>
	)
	*/
}

export default FieldProp
