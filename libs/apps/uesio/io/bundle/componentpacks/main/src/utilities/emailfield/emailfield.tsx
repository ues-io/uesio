import { ChangeEvent, FunctionComponent } from "react"
import { definition, styles, context, wire } from "@uesio/ui"

interface EmailFieldProps extends definition.UtilityProps {
	setValue: (value: wire.FieldValue) => void
	value: wire.FieldValue
	mode?: context.FieldMode
	placeholder?: string
}

const EmailField: FunctionComponent<EmailFieldProps> = (props) => {
	const { setValue, mode, placeholder } = props
	const value = props.value as string
	const readonly = mode === "READ"
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
			value={value}
			className={styles.cx(classes.input, readonly && classes.readonly)}
			type="email"
			disabled={readonly}
			onChange={(event: ChangeEvent<HTMLInputElement>): void =>
				setValue(event.target.value)
			}
			placeholder={placeholder}
		/>
	)
}

export default EmailField
