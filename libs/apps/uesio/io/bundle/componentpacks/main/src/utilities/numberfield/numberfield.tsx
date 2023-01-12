import { ChangeEvent, FunctionComponent } from "react"
import { definition, styles, context, collection, wire } from "@uesio/ui"
import { NumberFieldOptions } from "../../components/field/field"

interface NumberFieldProps extends definition.UtilityProps {
	setValue: (value: wire.FieldValue) => void
	value: wire.FieldValue
	fieldMetadata: collection.Field
	mode?: context.FieldMode
	options?: NumberFieldOptions
	placeholder?: string
}

const NumberField: FunctionComponent<NumberFieldProps> = (props) => {
	const { setValue, mode, placeholder, fieldMetadata, options } = props
	const readonly = mode === "READ"
	const value = props.value as number

	const classes = styles.useUtilityStyles(
		{
			input: {},
			readonly: {},
		},
		props
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
			step={options?.increment}
			min={options?.min}
			max={options?.max}
		/>
	)
}

export default NumberField
