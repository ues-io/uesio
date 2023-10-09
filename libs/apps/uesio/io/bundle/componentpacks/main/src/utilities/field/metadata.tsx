import { definition, collection, context, api, metadata, wire } from "@uesio/ui"
import NamespaceLabel from "../namespacelabel/namespacelabel"
import CustomSelect from "../customselect/customselect"
import TextField from "./text"

export type MetadataFieldOptions = {
	grouping?: string
	namespace?: string
}

interface MetadataFieldProps {
	fieldId: string
	fieldMetadata: collection.Field
	mode: context.FieldMode
	readonly?: boolean
	record?: wire.WireRecord
	value: wire.FieldValue
	setValue: (value: wire.FieldValue) => void
	// options allows for some metadata properties, such as grouping,
	// to be specified on a per-layout field basis.
	options?: MetadataFieldOptions
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
	const {
		value,
		setValue,
		context,
		fieldMetadata,
		mode,
		readonly,
		// record,
		options,
		variant,
	} = props

	// TODO: rather than useMetadataList, just do a wire load on the bundleable collection
	// this requires us to add basically any bundleable metadata collection to core
	if (!context.getWorkspace() && !context.getSiteAdmin()) {
		throw new Error("Must provide either siteadmin or workspace context")
	}
	const isMulti = fieldMetadata?.getType() === "MULTIMETADATA"

	const metadataFieldOptions =
		fieldMetadata?.getMetadataFieldMetadata() ||
		({} as collection.MetadataFieldMetadata)
	const { type } = metadataFieldOptions
	let { grouping, namespace } = metadataFieldOptions

	if (!type) {
		throw new Error("Metadata type is required")
	}

	// Allow metadata grouping to be overridden by the layout field definition
	if (options?.grouping) {
		grouping = options.grouping
	}
	if (options?.namespace) {
		namespace = options.namespace
	}

	// TODO: Find some way to propagate any error up to the FieldWrapper...
	// const [metadata, error] = api.builder.useMetadataList(
	const [metadata] = api.builder.useMetadataList(
		context,
		type,
		context.mergeString(namespace || ""),
		context.mergeString(grouping)
	)

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

	const isSelected = isMulti
		? (item: metadata.MetadataInfo) =>
				value && Array.isArray(value)
					? (value as string[]).includes(item.key)
					: false
		: (item: metadata.MetadataInfo) => item.key === value
	const onSelect = (item: metadata.MetadataInfo) => {
		if (isMulti) {
			setValue(value ? [...(value as string[]), item.key] : [item.key])
		} else {
			setValue(item.key)
		}
	}
	const onUnSelect = (item: metadata.MetadataInfo) => {
		if (isMulti) {
			setValue(
				value ? (value as string[]).filter((v) => v !== item.key) : []
			)
		} else {
			setValue("")
		}
	}

	if (readonly || mode === "READ") {
		return <TextField context={context} value={value} mode="READ" />
	}

	return (
		<CustomSelect
			items={items}
			itemRenderer={renderer}
			variant={variant}
			context={context}
			isMulti={isMulti}
			isSelected={isSelected}
			onSelect={onSelect}
			onUnSelect={onUnSelect}
			searchFilter={(item: metadata.MetadataInfo, search: string) =>
				item.key.includes(search)
			}
			getItemKey={(item: metadata.MetadataInfo) => item.key}
		/>
	)
}

MetadataField.displayName = "MetadataField"

export default MetadataField
