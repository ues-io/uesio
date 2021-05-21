import { ChangeEvent, FunctionComponent } from "react"
import { definition, styles, context, collection, wire } from "@uesio/ui"
import TextField from "../io.textfield/textfield"

interface SelectFieldProps extends definition.UtilityProps {
	label?: string
	setValue: (value: wire.FieldValue) => void
	value: string
	width?: string
	fieldMetadata: collection.Field
	hideLabel?: boolean
	mode?: context.FieldMode
	options: collection.SelectOption[] | null
}

const MultiSelectField: FunctionComponent<SelectFieldProps> = (props) => {
	const { setValue, value, mode, hideLabel, options } = props
	if (mode === "READ") {
		const optionMatch = options?.find((option) => option.value === value)
		const valueLabel = optionMatch?.label || ""
		return <TextField {...props} value={valueLabel} />
	}
	const width = props.definition?.width as string

	const classes = styles.useUtilityStyles(
		{
			root: {
				...(width && { width }),
			},
			label: {},
			input: {
				appearance: "none",
			},
		},
		props
	)

	return (
		<div className={classes.root}>
			{!hideLabel && <div className={classes.label}>{props.label}</div>}
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
			>
				{options?.map((option) => (
					<option
						value={option.value}
						selected={value.includes(option.value)}
					>
						{option.label}
					</option>
				))}
			</select>
		</div>
	)
}

export default MultiSelectField
