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
	root: ["grid", "grid-cols-3", "gap-1"],
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
	const Button = component.getUtility("uesio/io.button")
	const classes = styles.useUtilityStyleTokens(StyleDefaults, props, variant)

	const renderer = (item: wire.SelectOption) => (
		<div>{`${item.value} (${item.label})`}</div>
	)
	const getItemKey = (item: wire.SelectOption) => item.value

	const [items, setItems] = useState<wire.SelectOption[]>([])
	console.log("rerendering comboboxfield")
	const onSearch = debounce(async (search: string) => {
		if (!search?.trim().length) return
		const results = await props.onSearch(search)
		if (results && results.length > 0) {
			setItems(results)
		}
	}, 200)
	const [controlledValue, setControlledValue] = useState<string>(
		(value || "") as string
	)

	return (
		<div className={classes.root}>
			<TextField
				context={context}
				mode="EDIT"
				focusOnRender={focusOnRender}
				placeholder={placeholder}
				applyChanges="onChange"
				setValue={(v: string) => {
					if (v && v !== controlledValue) setControlledValue(v)
				}}
				value={controlledValue}
				id={`${id}-text-input`}
				variant={textVariant}
			/>
			<Menu
				onSelect={(v: string) => {
					console.log("on select running")
					if (v && v !== controlledValue) setControlledValue(v)
				}}
				getItemKey={getItemKey}
				itemRenderer={renderer}
				items={items}
				onSearch={onSearch}
				// searchFilter={searchFilter}
				context={context}
				variant={menuVariant}
				closeOnSelect={true}
				id={`${id}-menu`}
			>
				<IconButton
					icon="arrow_downward"
					context={context}
					className={classes.button}
					variant={iconButtonVariant}
				/>
			</Menu>
			<Button
				label="Go"
				context={context}
				onClick={() => {
					setValue?.(controlledValue)
				}}
				variant="uesio/io.button:uesio/builder.actionbutton"
			/>
		</div>
	)
}

export default ComboboxField
