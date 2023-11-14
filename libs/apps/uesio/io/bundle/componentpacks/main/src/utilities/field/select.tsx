import { definition, styles, context, wire, component } from "@uesio/ui"
import TextField from "./text"

interface SelectFieldProps {
	setValue: (value: wire.FieldValue) => void
	value: wire.FieldValue
	mode?: context.FieldMode
	options: wire.SelectOption[] | null
	readonly?: boolean
}

const StyleDefaults = Object.freeze({
	root: [],
	input: [],
	readonly: [],
})

const SelectField: definition.UtilityComponent<SelectFieldProps> = (props) => {
	const { readonly, setValue, mode, options, id, context } = props
	const value = (props.value as string) || ""
	const classes = styles.useUtilityStyleTokens(
		StyleDefaults,
		props,
		"uesio/io.selectfield"
	)

	if (mode === "READ") {
		const optionMatch = options?.find((option) => option.value === value)
		const valueLabel = optionMatch?.label || ""
		return (
			<TextField
				classes={classes}
				setValue={setValue}
				value={valueLabel}
				mode={mode}
				readonly={readonly}
				context={context}
			/>
		)
	}

	const renderOptions = (options: wire.SelectOption[]) => {
		if (!options || options.length === 0) {
			return
		}
		return options
			?.filter(({ validFor }) => component.shouldAll(validFor, context))
			.map(({ disabled, value, label, options: groupOptions }) =>
				groupOptions && groupOptions.length ? (
					<optgroup key={label} label={label}>
						{renderOptions(groupOptions)}
					</optgroup>
				) : (
					<option disabled={disabled} key={value} value={value}>
						{label}
					</option>
				)
			)
	}

	return (
		<div className={classes.root}>
			<select
				className={classes.input}
				disabled={readonly}
				onChange={(e) => setValue(e.target.value)}
				value={value}
				id={id}
			>
				{renderOptions(options || [])}
			</select>
		</div>
	)
}

export default SelectField
