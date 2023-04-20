import { FunctionComponent } from "react"
import { definition, styles, context, collection, wire } from "@uesio/ui"
import TextField from "./text"

interface SelectFieldProps extends definition.UtilityProps {
	setValue: (value: wire.FieldValue) => void
	value: wire.FieldValue
	fieldMetadata: collection.Field
	mode?: context.FieldMode
	options: collection.SelectOption[] | null
	readonly?: boolean
}

const SelectField: FunctionComponent<SelectFieldProps> = (props) => {
	const { readonly, setValue, mode, options, id } = props
	const value = (props.value as string) || ""

	if (mode === "READ") {
		const optionMatch = options?.find((option) => option.value === value)
		const valueLabel = optionMatch?.label || ""
		return <TextField {...props} value={valueLabel} />
	}

	const classes = styles.useUtilityStyles(
		{
			root: {},
			input: {},
		},
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
				{options?.map((option) => (
					<option
						disabled={option.disabled}
						key={option.value}
						value={option.value}
					>
						{option.label}
					</option>
				))}
			</select>
		</div>
	)
}

export default SelectField
