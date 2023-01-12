import { definition, styles, context, wire } from "@uesio/ui"
import TextField from "../textfield/textfield"

type DateFieldProps = {
	setValue: (value: wire.FieldValue) => void
	value: wire.FieldValue
	mode?: context.FieldMode
}

const DateField: definition.UtilityComponent<DateFieldProps> = (props) => {
	const { setValue, mode } = props

	// TODO: Better type checking here
	const value = props.value as string

	const readonly = mode === "READ"

	if (mode === "READ") {
		return (
			<TextField
				{...props}
				value={
					value
						? new Date(value).toLocaleDateString(undefined, {
								timeZone: "UTC",
						  })
						: ""
				}
				mode="READ"
			/>
		)
	}

	const classes = styles.useUtilityStyles(
		{
			input: {},
			readonly: {},
		},
		props,
		"uesio/io.field"
	)

	return (
		<input
			className={styles.cx(classes.input, readonly && classes.readonly)}
			value={value}
			type="date"
			disabled={readonly}
			onChange={(event) => setValue(event.target.value)}
		/>
	)
}

export default DateField
