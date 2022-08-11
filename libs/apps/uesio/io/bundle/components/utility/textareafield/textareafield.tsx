import { ChangeEvent, FunctionComponent } from "react"
import { definition, styles, context } from "@uesio/ui"

interface TextAreaFieldProps extends definition.UtilityProps {
	setValue: (value: string) => void
	value: string | null
	mode?: context.FieldMode
	placeholder?: string
}

const TextAreaField: FunctionComponent<TextAreaFieldProps> = (props) => {
	const { setValue, value, mode, placeholder } = props
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

	return <textarea {...commonProps} />
}

export default TextAreaField
