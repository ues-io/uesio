import { component, definition, styles, wire } from "@uesio/ui"

interface Props {
	applyChanges?: "onBlur" | "onChange"
	focusOnRender?: boolean
	placeholder?: string
	setValue?: (value: wire.PlainFieldValue) => void
	value?: wire.FieldValue
	items: wire.SelectOption[]
}

const StyleDefaults = Object.freeze({
	root: [],
})

const ComboboxField: definition.UtilityComponent<Props> = (props) => {
	const { context, focusOnRender, id, items, placeholder, setValue, value } =
		props
	const Menu = component.getUtility("uesio/io.menu")
	const TextField = component.getUtility("uesio/io.textfield")
	const classes = styles.useUtilityStyleTokens(StyleDefaults, props)

	return (
		<>
			<TextField
				context={context}
				mode="EDIT"
				focusOnRender={focusOnRender}
				placeholder={placeholder}
				applyChanges="onBlur"
				setValue={setValue}
				value={value}
				id={`${id}-text-input`}
			/>
			<Menu
				onSelect={onSelectFunc}
				getItemKey={getItemKey}
				itemRenderer={renderer}
				items={items}
				onSearch={onSearch}
				searchFilter={searchFilter}
				context={context}
				variant={menuVariant}
				closeOnSelect={true}
				id={`${id}-menu`}
			>
				<div className={classes.root}>
					<div className={classes.input}>
						{items.map((item) => (
							<div
								key={getItemKey(item)}
								className={classes.itemwrapper}
							>
								<div className={classes.iteminner}>
									{itemRenderer(item)}
								</div>
							</div>
						))}
					</div>
				</div>
			</Menu>
		</>
	)
}

export default ComboboxField
