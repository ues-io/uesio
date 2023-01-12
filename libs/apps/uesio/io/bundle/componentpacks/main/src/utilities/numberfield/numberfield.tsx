import { ChangeEvent, FunctionComponent } from "react"
import { definition, styles, context, collection, wire } from "@uesio/ui"

interface NumberFieldProps extends definition.UtilityProps {
	setValue: (value: wire.FieldValue) => void
	value: wire.FieldValue
	fieldMetadata: collection.Field
	mode?: context.FieldMode
	placeholder?: string
	max?: number
	min?: number
	increment?: number
}

const NumberField: FunctionComponent<NumberFieldProps> = (props) => {
	const { setValue, mode, placeholder, fieldMetadata, min, max, increment } =
		props
	const readonly = mode === "READ"
	const value = props.value as number

	const classes = styles.useUtilityStyles(
		{
			input: {},
			readonly: {},
		},
		props,
		"uesio/io.field"
	)

	const numberOptions = fieldMetadata?.getNumberMetadata()

	const decimals = numberOptions?.decimals ? numberOptions.decimals : 2
	const lvalue = readonly && value ? value.toFixed(decimals) : value

	return (
		<input
			value={lvalue || ""}
			className={styles.cx(classes.input, readonly && classes.readonly)}
			type="number"
			disabled={readonly}
			onChange={(event: ChangeEvent<HTMLInputElement>): void => {
				setValue(
					event.target.value ? parseFloat(event.target.value) : null
				)
			}}
			placeholder={placeholder}
			step={increment}
			min={min}
			max={max}
		/>
	)
}

export default NumberField
