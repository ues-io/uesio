import { definition, component, builder } from "@uesio/ui"

const MetadataPicker = component.getUtility("uesio/builder.metadatapicker")

const MetadataProp: builder.PropComponent<builder.MetadataProp> = (props) => {
	const { path, valueAPI, context, descriptor } = props
	const metadataType = descriptor.metadataType
	const value = valueAPI.get(path) as string

	if (!path) return null

	const getGrouping = (
		path: string | undefined,
		descriptor: builder.MetadataProp
	): string | undefined => {
		const {
			groupingParents = 1,
			groupingProperty,
			getGroupingFromKey,
			groupingValue,
		} = descriptor

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

		if (groupingProperty) {
			const lgroupingValue = groupingNode[groupingProperty] as string
			if (lgroupingValue) return lgroupingValue
		}

		return getGrouping(
			component.path.getGrandParentPath(path || ""),
			descriptor
		)
	}

	return (
		<MetadataPicker
			metadataType={metadataType}
			label={descriptor.label}
			labelPosition="left"
			value={value}
			setValue={(value: string) => valueAPI.set(path, value)}
			context={context}
			grouping={getGrouping(path, descriptor)}
			selectVariant="uesio/builder.propfield"
			fieldWrapperVariant="uesio/builder.propfield"
		/>
	)
}

export default MetadataProp
