import { FunctionComponent } from "react"
import { definition, styles, context, collection, wire } from "@uesio/ui"
import TextField from "./text"

interface SelectFieldProps extends definition.UtilityProps {
	setValue: (value: wire.FieldValue) => void
	value: wire.FieldValue
	fieldMetadata: collection.Field
	mode?: context.FieldMode
	options: collection.SelectOption[] | null
}

const SelectField: FunctionComponent<SelectFieldProps> = (props) => {
	const { setValue, mode, options, id } = props
	const value = props.value as string

	if (mode === "READ") {
		const optionMatch = options?.find((option) => option.value === value)
		const valueLabel = optionMatch?.label || ""
		return <TextField {...props} value={valueLabel} />
	}

	const classes = styles.useUtilityStyles(
		{
			root: {
				position: "relative",
				"&:after": {
					content: '"expand_more"',
					fontFamily: "Material Icons",
					position: "absolute",
					top: "50%",
					transform: "translateY(-50%)",
					pointerEvents: "none",
					fontSize: "initial",
				},
			},
			input: {
				appearance: "none",
			},
		},
		props,
		"uesio/io.selectfield"
	)

	return (
		<div className={classes.root}>
			<select
				className={classes.input}
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
