import { FunctionComponent } from "react"
import { PropRendererProps } from "./proprendererdefinition"
import { definition, component, hooks, builder } from "@uesio/ui"
import MetadataPicker from "../../utility/studio.metadatapicker/metadatapicker"

interface MetadataPropRendererProps extends PropRendererProps {
	descriptor: builder.MetadataProp
}

const MetadataProp: FunctionComponent<MetadataPropRendererProps> = (props) => {
	const { path, valueAPI, context, descriptor } = props
	const metadataType = descriptor.metadataType
	const value = valueAPI.get(path) as string

	if (!path) return null

	const getGrouping = (): string | undefined => {
		const {
			groupingParents = 1,
			groupingProperty,
			getGroupingFromKey,
		} = descriptor

		const groupingNodePath = component.path.getAncestorPath(
			path || "",
			groupingParents + 1
		)

		const groupingNode = valueAPI.get(
			groupingNodePath
		) as definition.DefinitionMap

		if (getGroupingFromKey)
			return component.path.getDefinitionKey(groupingNode)

		if (groupingProperty) return groupingNode[groupingProperty] as string
	}

	return (
		<MetadataPicker
			metadataType={metadataType}
			label={descriptor.label}
			value={value}
			setValue={(value) => valueAPI.set(path, value)}
			context={context}
			grouping={getGrouping()}
		/>
	)
}

export default MetadataProp
