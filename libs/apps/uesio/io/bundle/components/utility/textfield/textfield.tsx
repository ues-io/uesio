import React, { FC } from "react"
import { definition, styles, context, collection } from "@uesio/ui"

interface TextFieldProps extends definition.UtilityProps {
	setValue: (value: string) => void
	value: string | null
	fieldMetadata: collection.Field
	mode?: context.FieldMode
	placeholder?: string
	password?: boolean
	setEvent?: string
	onChange?: (e: React.ChangeEvent | null) => void
	onBlur?: (e: React.FocusEvent | null) => void
}

const TextField: FC<TextFieldProps> = (props) => {
	const { setValue, value, mode, placeholder, fieldMetadata, password } =
		props
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
		placeholder,
		className: styles.cx(classes.input, readonly && classes.readonly),
		disabled: readonly,
		onChange:
			props.onChange ||
			((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
				setValue(e.target.value)),
		onBlur: props.onBlur,
	}

	const inputType = password ? "password" : "text"
	return fieldMetadata && fieldMetadata.getType() === "LONGTEXT" ? (
		<textarea {...commonProps} />
	) : (
		<input value={value || ""} type={inputType} {...commonProps} />
	)
}

export default TextField
