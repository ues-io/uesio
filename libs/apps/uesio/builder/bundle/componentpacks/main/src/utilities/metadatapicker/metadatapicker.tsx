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

	const items = metadata ? Object.values(metadata) : []

	const renderer = (item: metadata.MetadataInfo) => (
		<NamespaceLabel
			metadatakey={item.key}
			metadatainfo={item}
			context={context}
		/>
	)

	const selectedItems = items
		? items.filter((item: metadata.MetadataInfo) => item.key === value)
		: []

	const toSelectItems = selectedItems
		? items
				.filter((x) => !selectedItems.includes(x))
				.concat(selectedItems.filter((x) => !items.includes(x)))
		: items

	return (
		<FieldWrapper
			labelPosition={labelPosition}
			variant={fieldWrapperVariant}
			label={label}
			context={context}
			errors={error ? [{ message: error }] : []}
		>
			<CustomSelect
				items={toSelectItems}
				itemRenderer={renderer}
				variant={variant}
				context={context}
				selectedItems={selectedItems}
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
