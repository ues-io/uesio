import { definition, styles, wire } from "@uesio/ui"

interface AutocompleteFieldProps {
	focusOnRender?: boolean
	options: wire.SelectOption[]
	placeholder?: string
	setValue?: (value: wire.PlainFieldValue) => void
	value?: wire.FieldValue
}

const StyleDefaults = Object.freeze({
	input: [],
	wrapper: [],
})

const AutocompleteField: definition.UtilityComponent<AutocompleteFieldProps> = (
	props
) => {
	const {
		focusOnRender,
		id,
		options,
		placeholder,
		setValue,
		value = "",
	} = props

	const classes = styles.useUtilityStyleTokens(
		StyleDefaults,
		props,
		"uesio/io.field"
	)
	const listId = `${id}-datalist`

	return (
		<div className={classes.wrapper}>
			<datalist id={listId}>
				{options.map((optionDef) => (
					<option key={optionDef.value} {...optionDef} />
				))}
			</datalist>
			<input
				id={id}
				list={listId}
				name={id}
				placeholder={placeholder}
				className={classes.input}
				ref={(input: HTMLInputElement) =>
					focusOnRender && input?.focus()
				}
				value={(value as string) || ""}
				onChange={(e) => {
					setValue?.(e.target.value)
				}}
			/>
		</div>
	)
}

export default AutocompleteField
