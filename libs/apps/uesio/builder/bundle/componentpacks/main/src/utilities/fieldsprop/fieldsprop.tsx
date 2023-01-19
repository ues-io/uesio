import { wire, util, definition } from "@uesio/ui"
import { FullPath } from "../../api/path"
import MultiSelectProp from "../../propertyrenderers/multiselectprop"

type FieldsProps = {
	path: FullPath
}

const FieldsProp: definition.UtilityComponent<FieldsProps> = (props) => {
	//const { path } = props
	/*
	const wirePath = component.path.parseRelativePath(
		props.descriptor.wireField,
		path || ""
	)
	*/
	const wireId = "" //valueAPI.get(wirePath)
	const wireDef = {} as wire.WireDefinition
	const options = util.getWireFieldSelectOptions(wireDef) || []

	return (
		<MultiSelectProp
			{...props}
			label="Fields"
			options={[
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
			]}
		/>
	)
}

export default FieldsProp
