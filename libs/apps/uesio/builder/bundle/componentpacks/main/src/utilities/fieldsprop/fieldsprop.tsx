import { builder, component, wire, util } from "@uesio/ui"

const MultiSelectProp = component.getUtility("uesio/builder.multiselectprop")

const FieldsProp: builder.PropComponent<builder.FieldsProp> = (props) => {
	const { valueAPI, path } = props
	const wirePath = component.path.parseRelativePath(
		props.descriptor.wireField,
		path || ""
	)
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

export default FieldsProp
