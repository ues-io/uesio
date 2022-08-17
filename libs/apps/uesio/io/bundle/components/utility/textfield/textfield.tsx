import { ChangeEvent, FunctionComponent } from "react"
import { definition, styles, context } from "@uesio/ui"

interface TextFieldProps extends definition.UtilityProps {
	setValue: (value: string) => void
	value: string | null
	mode?: context.FieldMode
	placeholder?: string
	password?: boolean
}

const TextField: FunctionComponent<TextFieldProps> = (props) => {
	const { setValue, value, mode, placeholder, password } = props
	const readonly = mode === "READ"
	const classes = styles.useUtilityStyles(
		{
			input: {
				resize: "none", // would be nicer to have this on implementation level
			},
			readonly: {},
		},
		props
	)

	const commonProps = {
		value: value || "",
		placeholder,
		className: styles.cx(classes.input, readonly && classes.readonly),
		disabled: readonly,
		onChange: (
			event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
		) => setValue(event.target.value),
	}

	const inputType = password ? "password" : "text"

	return <input type={inputType} {...commonProps} />
}

export default TextField
