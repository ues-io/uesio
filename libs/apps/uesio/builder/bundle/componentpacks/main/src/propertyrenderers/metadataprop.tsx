import { component, definition, metadata } from "@uesio/ui"
import { get, set } from "../api/defapi"
import { FullPath } from "../api/path"
import MetadataPicker from "../utilities/metadatapicker/metadatapicker"

interface MetadataProps {
	label: string
	path: FullPath
	metadataType: metadata.MetadataType
	groupingPath?: string
	groupingValue?: string
}

const MetadataProp: definition.UtilityComponent<MetadataProps> = (props) => {
	const { context, path, metadataType, label, groupingPath, groupingValue } =
		props

	if (!path) return null

	const value = get(context, path) as string

	const getGrouping = (
		path: FullPath,
		groupingPath?: string,
		groupingValue?: string
	): string | undefined => {
		if (groupingValue) return groupingValue
		if (!groupingPath) return undefined

		const parsePath = component.path.parseRelativePath(
			groupingPath,
			path.localPath || ""
		)

		return get(context, path.setLocal(parsePath)) as string
	}

	return (
		<MetadataPicker
			metadataType={metadataType}
			label={label}
			labelPosition="left"
			value={value}
			setValue={(value: string) => set(context, path, value)}
			context={context}
			grouping={getGrouping(path, groupingPath, groupingValue)}
			selectVariant="uesio/builder.propfield"
			variant="uesio/builder.metadatafield"
			fieldWrapperVariant="uesio/builder.propfield"
		/>
	)
}

export default MetadataProp
