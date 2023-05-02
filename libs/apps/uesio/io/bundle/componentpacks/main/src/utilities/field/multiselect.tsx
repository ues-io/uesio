import { FunctionComponent } from "react"
import { component, definition, context, collection, wire } from "@uesio/ui"

interface SelectFieldProps extends definition.UtilityProps {
	setValue: (value: wire.PlainFieldValue[]) => void
	value: wire.PlainFieldValue[]
	width?: string
	fieldMetadata: collection.Field
	mode?: context.FieldMode
	options: wire.SelectOption[] | null
}

const MultiSelectField: FunctionComponent<SelectFieldProps> = (props) => {
	const CustomSelect = component.getUtility("uesio/io.customselect")
	const Text = component.getUtility("uesio/io.text")

	const { setValue, value, mode, options, context } = props

	console.log({ options })

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
	const renderer = (item: collection.SelectOption) => (
		<Text text={item.label} context={context} />
	)
	const selectedItems = items
		? items.filter((item: collection.SelectOption) =>
				value.includes(item.value)
		  )
		: []

	return (
		<CustomSelect
			items={items}
			itemRenderer={renderer}
			context={context}
			selectedItems={selectedItems}
			onSelect={(item: collection.SelectOption) =>
				setValue([...value, item.value])
			}
			onUnSelect={(item: collection.SelectOption) =>
				setValue(value.filter((el) => el !== item.value))
			}
			searchFilter={(item: collection.SelectOption, search: string) =>
				item.label.includes(search)
			}
			getItemKey={(item: collection.SelectOption) => item.value}
		/>
	)
}

export default MultiSelectField
