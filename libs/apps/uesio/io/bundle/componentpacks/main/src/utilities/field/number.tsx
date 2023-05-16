import { FunctionComponent, useState } from "react"
import { definition, styles, context, collection, wire } from "@uesio/ui"
import { ApplyChanges } from "../../components/field/field"

export type NumberFieldOptions = {
	step?: number
	max?: number
	min?: number
}

interface NumberFieldProps extends definition.UtilityProps {
	applyChanges?: ApplyChanges
	setValue: (value: wire.FieldValue) => void
	value: wire.FieldValue
	fieldMetadata: collection.Field
	mode?: context.FieldMode
	options?: NumberFieldOptions
	placeholder?: string
}

const StyleDefaults = Object.freeze({
	input: [],
	readonly: [],
})

const NumberField: FunctionComponent<NumberFieldProps> = (props) => {
	const {
		mode,
		placeholder,
		fieldMetadata,
		id,
		options,
		setValue,
		applyChanges,
	} = props
	const readonly = mode === "READ"
	const value = props.value as number
	const applyOnBlur = applyChanges === "onBlur"

	const classes = styles.useUtilityStyleTokens(
		StyleDefaults,
		props,
		"uesio/io.field"
	)

	const numberOptions = fieldMetadata?.getNumberMetadata()
	const decimals = numberOptions?.decimals ? numberOptions.decimals : 2
	const initialValue = parseInt(
		`${readonly && value ? value.toFixed(decimals) : value}`,
		10
	)
	const [controlledValue, setControlledValue] = useState<number>(initialValue)

	return (
		<input
			id={id}
			value={controlledValue}
			className={styles.cx(classes.input, readonly && classes.readonly)}
			type="number"
			disabled={readonly}
			onChange={(e) => {
				const number = parseFloat(e.target.value)
				setControlledValue(number)
				!applyOnBlur && setValue?.(number)
			}}
			onBlur={() =>
				applyOnBlur &&
				initialValue !== controlledValue &&
				setValue?.(controlledValue)
			}
			placeholder={placeholder}
			step={options?.step}
			min={options?.min}
			max={options?.max}
		/>
	)
}

export default NumberField
