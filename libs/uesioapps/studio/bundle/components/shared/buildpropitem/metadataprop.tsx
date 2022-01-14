import { FunctionComponent } from "react"
import { definition, component, builder } from "@uesio/ui"
import MetadataPicker from "../../utility/studio.metadatapicker/metadatapicker"

interface MetadataPropRendererProps extends builder.PropRendererProps {
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
			groupingValue,
		} = descriptor

		console.log({ groupingProperty })

		if (groupingValue) return groupingValue

		const groupingNodePath = component.path.getAncestorPath(
			path || "",
			groupingParents + 1
		)

		const groupingNode = valueAPI.get(
			groupingNodePath
		) as definition.DefinitionMap

		if (!groupingNode) return undefined

		if (getGroupingFromKey)
			return component.path.getDefinitionKey(groupingNode)

		if (groupingProperty) return groupingNode[groupingProperty] as string
	}

	return (
		<MetadataPicker
			metadataType={metadataType}
			label={descriptor.label}
			labelPosition="left"
			value={value}
			setValue={(value) => valueAPI.set(path, value)}
			context={context}
			grouping={getGrouping()}
			selectVariant="studio.propfield"
			fieldWrapperVariant="studio.propfield"
		/>
	)
}

export default MetadataProp
