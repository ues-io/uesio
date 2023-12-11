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

// adds an option for the current value if it is not present in the options list.
export const addSelectedValueToOptions = (
	options: wire.SelectOption[] = [],
	value: string
): wire.SelectOption[] => {
	const optionMatch = options?.find((option) => option.value === value)
	if (!optionMatch && value) {
		return [
			...options,
			{
				label: value,
				value,
				disabled: true,
			} as wire.SelectOption,
		]
	} else return options
}

// adds option(s) for all currently selected values not present in the options list
export const addSelectedValuesToOptions = (
	options: wire.SelectOption[] = [],
	values: string[]
): wire.SelectOption[] => {
	const missingValues = values.filter(
		(value) => !options.find((option) => option.value === value)
	)
	if (missingValues.length) {
		return [
			...options,
			...missingValues.map(
				(value) =>
					({
						label: value,
						value,
						disabled: true,
					} as wire.SelectOption)
			),
		]
	} else return options
}

const SelectField: definition.UtilityComponent<SelectFieldProps> = (props) => {
	const { readonly, setValue, mode, options = [], id, context } = props
	const value = (props.value as string) || ""
	const classes = styles.useUtilityStyleTokens(
		StyleDefaults,
		props,
		"uesio/io.selectfield"
	)
	if (mode === "READ") {
		const optionMatch = options?.find((option) => option.value === value)
		return (
			<TextField
				classes={classes}
				setValue={setValue}
				value={optionMatch?.label || value}
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
