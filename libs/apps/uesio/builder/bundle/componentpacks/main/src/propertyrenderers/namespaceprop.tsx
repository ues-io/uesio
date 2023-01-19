import { api, definition, collection } from "@uesio/ui"
import { FullPath } from "../api/path"
import SelectProp from "./selectprop"
const addBlankSelectOption = collection.addBlankSelectOption

interface NamespaceProps {
	label: string
	path: FullPath
}

const NamespaceProp: definition.UtilityComponent<NamespaceProps> = (props) => {
	const [namespaces] = api.builder.useAvailableNamespaces(props.context)
	const options =
		namespaces?.map((entry) => ({
			label: entry,
			value: entry,
		})) || []

	return (
		<SelectProp
			{...props}
			options={addBlankSelectOption(options, "Select a namespace")}
		/>
	)
}

export default NamespaceProp
