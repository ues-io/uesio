import { definition, component, api, metadata } from "@uesio/ui"
import NamespaceLabel from "../namespacelabel/namespacelabel"

interface MetadataPickerProps {
	value: string | undefined
	setValue: (value: string) => void
	metadataType: metadata.MetadataType
	label: string
	labelPosition?: string
	grouping?: string
	defaultNamespace?: string
	fieldWrapperVariant?: metadata.MetadataKey
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

const MetadataPicker: definition.UtilityComponent<MetadataPickerProps> = (
	props
) => {
	const CustomSelect = component.getUtility("uesio/io.customselect")
	const FieldWrapper = component.getUtility("uesio/io.fieldwrapper")
	const {
		value,
		setValue,
		label,
		labelPosition,
		metadataType,
		context,
		grouping,
		fieldWrapperVariant,
		variant,
	} = props

	if (!context.getWorkspace() && !context.getSiteAdmin()) {
		throw new Error("Must provide either siteadmin or workspace context")
	}

	const [metadata, error] = api.builder.useMetadataList(
		context,
		metadataType,
		"",
		grouping
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

	const isSelected = (item: metadata.MetadataInfo) => item.key === value

	return (
		<FieldWrapper
			labelPosition={labelPosition}
			variant={fieldWrapperVariant}
			label={label}
			context={context}
			errors={error ? [{ message: error }] : []}
		>
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
		</FieldWrapper>
	)
}

MetadataPicker.displayName = "MetadataPicker"

export default MetadataPicker
