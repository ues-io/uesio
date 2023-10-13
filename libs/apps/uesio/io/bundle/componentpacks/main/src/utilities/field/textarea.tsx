import { definition, styles, context, wire } from "@uesio/ui"
import { ApplyChanges } from "../../components/field/field"
import { useControlledInput } from "../../shared/useControlledFieldValue"
export type LongTextFieldOptions = {
	cols?: number
	rows?: number
}

interface TextAreaFieldProps {
	setValue: (value: wire.FieldValue) => void
	value: wire.FieldValue
	mode?: context.FieldMode
	placeholder?: string
	options?: LongTextFieldOptions
	applyChanges?: ApplyChanges
	focusOnRender?: boolean
	readonly?: boolean
}

const StyleDefaults = Object.freeze({
	input: [],
	readonly: [],
})

const TextAreaField: definition.UtilityComponent<TextAreaFieldProps> = (
	props
) => {
	const {
		id,
		mode,
		placeholder,
		options,
		setValue,
		applyChanges,
		focusOnRender = false,
	} = props
	const value = props.value as string
	const readonly = props.readonly || mode === "READ"

	const controlledInputProps = useControlledInput(
		value,
		setValue,
		applyChanges,
		readonly
	)

	const classes = styles.useUtilityStyleTokens(
		StyleDefaults,
		props,
		"uesio/io.field"
	)

	const commonProps = {
		id,
		placeholder,
		...controlledInputProps,
		className: styles.cx(classes.input, readonly && classes.readonly),
		readonly: true,
		rows: options?.rows,
		cols: options?.cols,
	}

	return <textarea {...commonProps} autoFocus={focusOnRender} />
}

export default TextAreaField
