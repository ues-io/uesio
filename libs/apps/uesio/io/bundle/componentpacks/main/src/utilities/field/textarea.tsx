import { ChangeEvent, FunctionComponent } from "react"
import { definition, styles, context, wire } from "@uesio/ui"
import { CSSInterpolation } from "@emotion/css"

export type LongTextFieldOptions = {
	cols?: number
	rows?: number
}

interface TextAreaFieldProps extends definition.UtilityProps {
	setValue: (value: wire.FieldValue) => void
	value: wire.FieldValue
	mode?: context.FieldMode
	placeholder?: string
	options?: LongTextFieldOptions
}

const StyleDefaults = Object.freeze({
	input: {
		resize: "none", // would be nicer to have this on implementation level
	},
	readonly: {},
} as Record<string, CSSInterpolation>)

const TextAreaField: FunctionComponent<TextAreaFieldProps> = (props) => {
	const { id, mode, placeholder, options, setValue } = props
	const value = props.value as string
	const readonly = mode === "READ"
	const classes = styles.useUtilityStyles(
		StyleDefaults,
		props,
		"uesio/io.field"
	)

	const commonProps = {
		id,
		value: value || "",
		placeholder,
		className: styles.cx(classes.input, readonly && classes.readonly),
		disabled: readonly,
		onChange: (
			event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
		) => setValue(event.target.value),
		rows: options?.rows,
		cols: options?.cols,
	}

	return <textarea {...commonProps} />
}

export default TextAreaField
