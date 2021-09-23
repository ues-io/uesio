import { FunctionComponent } from "react"
import { hooks, builder } from "@uesio/ui"
import SelectProp from "./selectprop"
interface NamespaceRendererProps extends builder.PropRendererProps {
	path: string
}
const NamespaceProp: FunctionComponent<NamespaceRendererProps> = (props) => {
	const uesio = hooks.useUesio(props)
	const namespaces = uesio.builder.useAvailableNamespaces(props.context)
	const options = Object.keys(namespaces || {}).map((entry) => ({
		label: entry,
		value: entry,
	}))

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
