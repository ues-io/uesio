import { ChangeEvent, FunctionComponent } from "react"
import { definition, styles, context, collection, wire } from "@uesio/ui"
import TextField from "../textfield/textfield"

export interface SelectFieldProps extends definition.UtilityProps {
	setValue: (value: wire.FieldValue) => void
	value: string[]
	width?: string
	fieldMetadata: collection.Field
	mode?: context.FieldMode
	options: collection.SelectOption[] | null
}

const MultiSelectField: FunctionComponent<SelectFieldProps> = (props) => {
	const { setValue, value, mode, options } = props
	if (mode === "READ") {
		const optionMatch = options?.find((option) =>
			value.includes(option.value)
		)
		const valueLabel = optionMatch?.label || ""
		return <TextField {...props} value={valueLabel} />
	}

	const classes = styles.useUtilityStyles(
		{
			input: {
				appearance: "none",
			},
		},
		props
	)

	return (
		<select
			multiple
			className={classes.input}
			onChange={(event: ChangeEvent<HTMLSelectElement>) => {
				setValue(
					Array.from(
						event.target.selectedOptions,
						(option) => option.value
					)
				)
			}}
			value={value}
		>
			{options?.map((option) => (
				<option key={option.value} value={option.value}>
					{option.label}
				</option>
			))}
		</select>
	)
}

export default MultiSelectField
