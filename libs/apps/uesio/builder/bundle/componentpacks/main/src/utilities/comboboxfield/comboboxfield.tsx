import { component, definition, metadata, styles, wire } from "@uesio/ui"
import debounce from "lodash/debounce"
import { useState } from "react"

type ComboboxProps = {
	applyChanges?: "onBlur" | "onChange"
	focusOnRender?: boolean
	placeholder?: string
	setValue?: (value: wire.PlainFieldValue) => void
	value?: wire.FieldValue
	items: wire.SelectOption[]
	onSearch: (search: string) => Promise<wire.SelectOption[]>
	textVariant?: metadata.MetadataKey
}

const StyleDefaults = Object.freeze({
	root: [],
	input: [],
	itemwrapper: [],
	iteminner: [],
})

const ComboboxField: definition.UtilityComponent<ComboboxProps> = (props) => {
	const {
		context,
		focusOnRender,
		id,
		items,
		placeholder,
		setValue,
		value,
		textVariant,
	} = props
	const Menu = component.getUtility("uesio/io.menu")
	const TextField = component.getUtility("uesio/io.textfield")
	// const classes = styles.useUtilityStyleTokens(
	// 	StyleDefaults,
	// 	props,
	// 	"uesio/io.default"
	// )
	const Button = component.getUtility("uesio/io.button")
	const renderer = (item: wire.SelectOption) => (
		<div>{`${item.value} (${item.label})`}</div>
	)
	const getItemKey = (item: wire.SelectOption) => item.value
	const onSearch = debounce(async (search: string) => {
		const result = await props.onSearch(search)
		console.log("awaited results", result)
		return result
	}, 200)

	const [controlledValue, setControlledValue] = useState(value)

	return (
		<>
			<TextField
				context={context}
				mode="EDIT"
				focusOnRender={focusOnRender}
				placeholder={placeholder}
				applyChanges="onBlur"
				setValue={setValue}
				value={controlledValue}
				id={`${id}-text-input`}
				variant={textVariant}
			/>
			<Menu
				onSelect={setControlledValue}
				getItemKey={getItemKey}
				itemRenderer={renderer}
				items={items}
				onSearch={onSearch}
				// searchFilter={searchFilter}
				context={context}
				variant="uesio/io.default"
				closeOnSelect={true}
				id={`${id}-menu`}
			>
				<Button icon="search" label="Select" context={context} />
			</Menu>
		</>
	)
}

export default ComboboxField
