import { ChangeEvent, FunctionComponent } from "react"
import { definition, styles, context, collection, component } from "@uesio/ui"

interface TextFieldProps extends definition.UtilityProps {
	setValue: (value: string) => void
	value: string | null
	fieldMetadata: collection.Field
	mode?: context.FieldMode
	placeholder?: string
}

const TextField: FunctionComponent<TextFieldProps> = (props) => {
	const { setValue, value, mode, placeholder, fieldMetadata } = props
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

	return fieldMetadata && fieldMetadata.getType() === "LONGTEXT" ? (
		<textarea {...commonProps} />
	) : (
		<input type="text" {...commonProps} />
	)
}

export default TextField
