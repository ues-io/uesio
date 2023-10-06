import {
	definition,
	collection,
	component,
	context,
	api,
	metadata,
	wire,
} from "@uesio/ui"
import NamespaceLabel from "../namespacelabel/namespacelabel"

interface MetadataFieldProps {
	fieldId: string
	fieldMetadata: collection.Field
	mode: context.FieldMode
	readonly?: boolean
	record?: wire.WireRecord
	value: wire.FieldValue
	setValue: (value: string) => void
}

export const sortMetadata = (
	metadata: Record<string, metadata.MetadataInfo>,
	contextApp?: string
): metadata.MetadataInfo[] => {
	// Prioritize same-app metadata items in the list
	const values = Object.values(metadata)
	values.sort((a, b) => {
		if (contextApp) {
			const aInApp = a.namespace === contextApp
			const bInApp = b.namespace === contextApp
			if (aInApp && bInApp) return 0
			if (aInApp && !bInApp) return -1
			if (bInApp && !aInApp) return 1
		}
		return a.key.localeCompare(b.key)
	})
	return values
}

const MetadataField: definition.UtilityComponent<MetadataFieldProps> = (
	props
) => {
	const CustomSelect = component.getUtility("uesio/io.customselect")
	const {
		value,
		setValue,
		context,
		fieldMetadata,
		// record,
		variant,
	} = props

	// TODO: rather than useMetadataList, just do a wire load on the bundleable collection
	// this requires us to add basically any bundleable metadata collection to core
	if (!context.getWorkspace() && !context.getSiteAdmin()) {
		throw new Error("Must provide either siteadmin or workspace context")
	}

	const metadataFieldOptions = fieldMetadata?.getMetadataFieldMetadata()
	const { grouping, type } = metadataFieldOptions || {}

	if (!type) {
		throw new Error("Metadata type is required")
	}

	// TODO: Find some way to propagate any error up to the FieldWrapper...
	// const [metadata, error] = api.builder.useMetadataList(
	const [metadata] = api.builder.useMetadataList(context, type, "", grouping)

	const contextApp =
		context.getWorkspace()?.app || context.getSiteAdmin()?.app

	const items = metadata ? sortMetadata(metadata, contextApp) : []

	const renderer = (item: metadata.MetadataInfo) => (
		<NamespaceLabel
			metadatakey={item.key}
			metadatainfo={item}
			context={context}
		/>
	)

	const isSelected = (item: metadata.MetadataInfo) => item.key === value

	return (
		<CustomSelect
			items={items}
			itemRenderer={renderer}
			variant={variant}
			context={context}
			isSelected={isSelected}
			onSelect={(item: metadata.MetadataInfo) => setValue(item.key)}
			onUnSelect={() => setValue("")}
			searchFilter={(item: metadata.MetadataInfo, search: string) =>
				item.key.includes(search)
			}
			getItemKey={(item: metadata.MetadataInfo) => item.key}
		/>
	)
}

MetadataField.displayName = "MetadataField"

export default MetadataField
