import { hooks, builder, collection } from "@uesio/ui"
import SelectProp from "../selectprop/selectprop"
const addBlankSelectOption = collection.addBlankSelectOption

const NamespaceProp: builder.PropComponent<builder.NamespaceProp> = (props) => {
	const uesio = hooks.useUesio(props)
	const [namespaces] = uesio.builder.useAvailableNamespaces(props.context)
	const options =
		namespaces?.map((entry) => ({
			label: entry,
			value: entry,
		})) || []

	return (
		<SelectProp
			{...props}
			descriptor={{
				...props.descriptor,
				type: "SELECT",
				options: addBlankSelectOption(options, "Select a namespace"),
			}}
		/>
	)
}

export default NamespaceProp
