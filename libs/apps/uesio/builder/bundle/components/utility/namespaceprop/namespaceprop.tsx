import { hooks, builder } from "@uesio/ui"
import SelectProp from "../selectprop/selectprop"

const NamespaceProp: builder.PropComponent<builder.NamespaceProp> = (props) => {
	const uesio = hooks.useUesio(props)
	const namespaces = uesio.builder.useAvailableNamespaces(props.context)
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
				options,
			}}
		/>
	)
}

export default NamespaceProp
