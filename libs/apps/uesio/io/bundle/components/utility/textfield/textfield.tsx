import { FunctionComponent, useState } from "react"
import { definition, styles, context, collection } from "@uesio/ui"

interface TextFieldProps extends definition.UtilityProps {
	setValue: (value: string) => void
	value: string | null
	fieldMetadata: collection.Field
	mode?: context.FieldMode
	placeholder?: string
	password?: boolean
	trigger?: string
}

const TextField: FunctionComponent<TextFieldProps> = (props) => {
	const {
		// trigger,
		setValue,
		value,
		mode,
		placeholder,
		fieldMetadata,
		password,
	} = props
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
		// value: value || "",
		placeholder,
		className: styles.cx(classes.input, readonly && classes.readonly),
		disabled: readonly,
		// onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
		// 	setValue(event.target.value),
	}

	const inputType = password ? "password" : "text"
	const [xValue, setXValue] = useState(value || "")
	return fieldMetadata && fieldMetadata.getType() === "LONGTEXT" ? (
		<textarea {...commonProps} />
	) : (
		<input
			onChange={(e) => setXValue(e.target.value)}
			onBlur={() => setValue(xValue)}
			value={xValue}
			type={inputType}
			{...commonProps}
		/>
	)
}

export default TextField
