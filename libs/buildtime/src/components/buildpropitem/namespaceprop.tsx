import React, { FunctionComponent } from "react"
import { PropRendererProps } from "./proprendererdefinition"
import { context, hooks } from "@uesio/ui"
import SelectProp from "./selectprop"
interface NamespaceRendererProps extends PropRendererProps {
	context: context.Context
	path: string
}
const NamespaceProp: FunctionComponent<NamespaceRendererProps> = (props) => {
	const uesio = hooks.useUesio(props)
	const namespaces = uesio.builder.useAvailableNamespaces(props.context)
	let options: { label: string; value: string }[] = []
	if (namespaces) {
		options = Object.keys(namespaces).map((entry) => ({
			label: entry,
			value: entry,
		}))
	}
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
