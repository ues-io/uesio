import { ChangeEvent, FunctionComponent } from "react"
import { definition, styles, context, collection, component } from "@uesio/ui"

interface DateFieldProps extends definition.UtilityProps {
	setValue: (value: string) => void
	value: string
	fieldMetadata: collection.Field
	mode?: context.FieldMode
}

const TextField = component.getUtility("uesio/io.textfield")

const DateField: FunctionComponent<DateFieldProps> = (props) => {
	const { setValue, value, mode } = props

	const readonly = mode === "READ"

	if (mode === "READ") {
		if (props.value) {
			const timestamp = props.value
			const date = new Date(timestamp)
			const value = `${date.toLocaleDateString()}`
			return <TextField {...props} value={value} mode="READ" />
		}
		return <TextField {...props} mode="READ" />
	}

	const classes = styles.useUtilityStyles(
		{
			input: {},
			readonly: {},
		},
		props
	)

	return (
		<input
			className={styles.cx(classes.input, readonly && classes.readonly)}
			value={value}
			type="date"
			disabled={readonly}
			onChange={(event: ChangeEvent<HTMLInputElement>): void =>
				setValue(event.target.value)
			}
		/>
	)
}

export default DateField
