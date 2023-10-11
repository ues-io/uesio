import { component, definition, context, collection, wire } from "@uesio/ui"

interface SelectFieldProps {
	setValue: (value: wire.PlainFieldValue[]) => void
	value: wire.PlainFieldValue[]
	width?: string
	fieldMetadata: collection.Field
	mode?: context.FieldMode
	options: wire.SelectOption[] | null
}

const MultiSelectField: definition.UtilityComponent<SelectFieldProps> = (
	props
) => {
	const CustomSelect = component.getUtility("uesio/io.customselect")
	const { setValue, value, mode, options, context, variant } = props
	if (mode === "READ") {
		let displayLabel
		if (value !== undefined && value.length) {
			const valuesArray = value as wire.PlainFieldValue[]
			displayLabel = options
				?.filter((option) => valuesArray.includes(option.value))
				.map((option) => option?.label || option.value)
				.join(", ")
		}
		return <span>{displayLabel || ""}</span>
	}

	const items = options || []
	const renderer = (item: collection.SelectOption) => item.label
	const isSelected = (item: collection.SelectOption) =>
		value && value.includes(item.value)

	return (
		<CustomSelect
			items={items}
			itemRenderer={renderer}
			context={context}
			isMulti={true}
			variant={variant}
			isSelected={isSelected}
			onSelect={(item: collection.SelectOption) =>
				setValue([...value, item.value])
			}
			onUnSelect={(item: collection.SelectOption) =>
				setValue(value.filter((el) => el !== item.value))
			}
			searchFilter={(item: collection.SelectOption, search: string) =>
				item.label
					.toLocaleLowerCase()
					.includes(search.toLocaleLowerCase())
			}
			getItemKey={(item: collection.SelectOption) => item.value}
		/>
	)
}

export default MultiSelectField
