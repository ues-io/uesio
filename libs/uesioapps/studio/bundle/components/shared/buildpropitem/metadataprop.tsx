import { FunctionComponent } from "react"
import { PropRendererProps } from "./proprendererdefinition"
import { definition, component, hooks, builder } from "@uesio/ui"
import MetadataPicker from "../../utility/studio.metadatapicker/metadatapicker"

interface MetadataPropRendererProps extends PropRendererProps {
	descriptor: builder.MetadataProp
}

const MetadataProp: FunctionComponent<MetadataPropRendererProps> = (props) => {
	const uesio = hooks.useUesio(props)
	const { path, getValue, context, setValue, descriptor } = props
	const metadataType = descriptor.metadataType
	const value = getValue() as string

	let grouping = ""

	if (descriptor.groupingParents) {
		console.log("GR")
		const groupingNodePath = component.path.getAncestorPath(
			path || "",
			descriptor.groupingParents
		)

		const groupingNode = uesio.view.useDefinition(
			groupingNodePath
		) as definition.DefinitionMap

		if (!descriptor.groupingProperty) {
			return null
		}

		grouping = groupingNode[descriptor.groupingProperty] as string
	}

	return (
		<MetadataPicker
			metadataType={metadataType}
			label={descriptor.label}
			value={value}
			setValue={setValue}
			context={context}
			grouping={grouping}
		/>
	)
}

export default MetadataProp
