import { component, definition, metadata, styles, wire } from "@uesio/ui"
import debounce from "lodash/debounce"
import { useState } from "react"

type ComboboxProps = {
	applyChanges?: "onBlur" | "onChange"
	focusOnRender?: boolean
	placeholder?: string
	setValue?: (value: wire.PlainFieldValue) => void
	value?: wire.FieldValue
	onSearch: (search: string) => Promise<wire.SelectOption[]>
	textVariant?: metadata.MetadataKey
	menuVariant?: metadata.MetadataKey
	iconButtonVariant?: metadata.MetadataKey
	variant?: metadata.MetadataKey
}

const StyleDefaults = Object.freeze({
	root: [],
	button: [],
	input: [],
	itemwrapper: [],
	iteminner: [],
})

const ComboboxField: definition.UtilityComponent<ComboboxProps> = (props) => {
	const {
		context,
		focusOnRender,
		id,
		placeholder,
		setValue,
		value,
		iconButtonVariant,
		menuVariant,
		textVariant,
		variant = "uesio/io.default",
	} = props
	const Menu = component.getUtility("uesio/io.menu")
	const TextField = component.getUtility("uesio/io.textfield")
	const IconButton = component.getUtility("uesio/io.iconbutton")
	const classes = styles.useUtilityStyleTokens(StyleDefaults, props, variant)

	const renderer = (item: wire.SelectOption) => (
		<div>{`${item.value} (${item.label})`}</div>
	)
	const getItemKey = (item: wire.SelectOption) => item.value

	const [items, setItems] = useState<wire.SelectOption[]>([])
	console.log("rerendering comboboxfield")
	const onSearch = debounce(async (search: string) => {
		const results = await props.onSearch(search)
		setItems(results)
	}, 200)

	return (
		<div className={classes.root}>
			<TextField
				context={context}
				mode="EDIT"
				focusOnRender={focusOnRender}
				placeholder={placeholder}
				applyChanges="onBlur"
				setValue={(v: string) => {
					if (!v?.trim()) return
					setValue?.(v)
				}}
				value={value}
				id={`${id}-text-input`}
				variant={textVariant}
			/>
			<Menu
				onSelect={(v: string) => v && setValue?.(v)}
				getItemKey={getItemKey}
				itemRenderer={renderer}
				items={items}
				onSearch={onSearch}
				// searchFilter={searchFilter}
				context={context}
				variant={menuVariant}
				closeOnSelect={true}
				open={true}
				id={`${id}-menu`}
			>
				<IconButton
					icon="arrow_downward"
					context={context}
					className={classes.button}
					variant={iconButtonVariant}
				/>
			</Menu>
		</div>
	)
}

export default ComboboxField
