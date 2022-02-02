import { ChangeEvent, FunctionComponent } from "react"
import { definition, styles, context, collection } from "@uesio/ui"

interface TextFieldProps extends definition.UtilityProps {
	setValue: (value: string) => void
	value: string | null
	fieldMetadata: collection.Field
	mode?: context.FieldMode
	placeholder?: string
	password?: boolean
}

const TextField: FunctionComponent<TextFieldProps> = (props) => {
	const { setValue, value, mode, placeholder, fieldMetadata, password } =
		props

	const type = fieldMetadata.getType()
	const readonly = mode === "READ" || type === "AUTONUMBER"
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

	return fieldMetadata && fieldMetadata.getType() === "LONGTEXT" ? (
		<textarea {...commonProps} />
	) : (
		<input type={inputType} {...commonProps} />
	)
}

export default TextField
