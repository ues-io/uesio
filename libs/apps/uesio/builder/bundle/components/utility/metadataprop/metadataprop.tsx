import { component, builder } from "@uesio/ui"

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
		const { groupingPath, groupingValue } = descriptor

		if (groupingValue) return groupingValue

		if (!groupingPath) return undefined

		const parsePath = component.path.parseRelativePath(
			groupingPath,
			path || ""
		)

		const groupingNode = valueAPI.get(parsePath)

		return groupingNode as string
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
