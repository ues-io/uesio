import { ChangeEvent, FunctionComponent } from "react"
import { definition, styles, context, collection } from "@uesio/ui"
import TextField from "../io.textfield/textfield"

interface SelectFieldProps extends definition.UtilityProps {
	label?: string
	setValue: (value: string) => void
	value: string
	width?: string
	fieldMetadata: collection.Field
	hideLabel?: boolean
	mode?: context.FieldMode
	options: collection.SelectOption[] | null
}

const SelectField: FunctionComponent<SelectFieldProps> = (props) => {
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
				position: "relative",
				"&:after": {
					content: '"expand_more"',
					fontFamily: "Material Icons",
					position: "absolute",
					right: "10px",
					bottom: "20px",
					pointerEvents: "none",
				},
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
				className={classes.input}
				onChange={(event: ChangeEvent<HTMLSelectElement>): void =>
					setValue(event.target.value)
				}
			>
				{options?.map((option) => (
					<option
						value={option.value}
						selected={value === option.value}
					>
						{option.label}
					</option>
				))}
			</select>
		</div>
	)
}

export default SelectField
