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

	const getGrouping = (): string | undefined => {
		const { groupingParents, groupingProperty, metadataType } = descriptor
		if (!groupingParents || !groupingProperty) return

		const groupingNodePath = component.path.getAncestorPath(
			path || "",
			groupingParents
		)
		const groupingNode = uesio.view.useDefinition(
			groupingNodePath
		) as definition.DefinitionMap

		if (metadataType === "COMPONENTVARIANT")
			return Object.keys(groupingNode)[0]

		return groupingNode[groupingProperty] as string
	}

	return (
		<MetadataPicker
			metadataType={metadataType}
			label={descriptor.label}
			value={value}
			setValue={setValue}
			context={context}
			grouping={getGrouping()}
		/>
	)
}

export default MetadataProp
