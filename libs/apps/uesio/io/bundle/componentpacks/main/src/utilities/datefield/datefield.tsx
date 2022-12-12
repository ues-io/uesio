import { FC } from "react"
import { definition, styles, context, collection, component } from "@uesio/ui"

interface DateFieldProps extends definition.UtilityProps {
	setValue: (value: string) => void
	value: string
	fieldMetadata: collection.Field
	mode?: context.FieldMode
}

const TextField = component.getUtility("uesio/io.textfield")

const DateField: FC<DateFieldProps> = (props) => {
	const { setValue, value, mode } = props

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
		props
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
