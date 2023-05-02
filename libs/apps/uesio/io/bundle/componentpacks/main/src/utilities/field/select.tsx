import { FunctionComponent } from "react"
import {
	definition,
	styles,
	context,
	collection,
	wire,
	component,
} from "@uesio/ui"
import TextField from "./text"

interface SelectFieldProps extends definition.UtilityProps {
	setValue: (value: wire.FieldValue) => void
	value: wire.FieldValue
	fieldMetadata: collection.Field
	mode?: context.FieldMode
	options: wire.SelectOption[] | null
	readonly?: boolean
}

const StyleDefaults = Object.freeze({
	root: [],
	input: [],
})

const SelectField: FunctionComponent<SelectFieldProps> = (props) => {
	const { readonly, setValue, mode, options, id, context } = props
	const value = (props.value as string) || ""

	if (mode === "READ") {
		const optionMatch = options?.find((option) => option.value === value)
		const valueLabel = optionMatch?.label || ""
		return <TextField {...props} value={valueLabel} />
	}

	const classes = styles.useUtilityStyleTokens(
		StyleDefaults,
		props,
		"uesio/io.selectfield"
	)

	return (
		<div className={classes.root}>
			<select
				className={classes.input}
				disabled={readonly}
				onChange={(e) => setValue(e.target.value)}
				value={value}
				id={id}
			>
				{options
					?.filter(({ validFor }) =>
						component.shouldAll(validFor, context)
					)
					.map(({ disabled, value, label }) => (
						<option disabled={disabled} key={value} value={value}>
							{label}
						</option>
					))}
			</select>
		</div>
	)
}

export default SelectField
