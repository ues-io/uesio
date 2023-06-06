import { FunctionComponent } from "react"
import { definition, styles, context, collection, wire } from "@uesio/ui"
import { ApplyChanges } from "../../components/field/field"
import { useControlledInputNumber } from "../../shared/useControlledFieldValue"

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
	type?: "number" | "range"
}

const StyleDefaults = Object.freeze({
	input: [],
	readonly: [],
	wrapper: ["flex"],
	rangevalue: ["p-2"],
})

const parseNumberValue = (
	value: string | number,
	decimals: number,
	readonly: boolean
) => {
	if (isNaN(value as number)) return value.toString()
	return readonly
		? parseFloat(
				`${
					value &&
					typeof value === "number" &&
					value.toFixed(decimals)
				}`
		  )
		: value
}

const NumberField: FunctionComponent<NumberFieldProps> = (props) => {
	const {
		mode,
		placeholder,
		fieldMetadata,
		id,
		options,
		setValue,
		applyChanges,
		type = "number",
	} = props

	console.log("NumberField")
	console.log(typeof props.value)
	console.log(props.value)

	const readonly = mode === "READ"
	const numberOptions = fieldMetadata?.getNumberMetadata()
	const decimals = numberOptions?.decimals || 2

	const { onChange, onBlur, value } = useControlledInputNumber(
		props.value as string | number,
		setValue,
		applyChanges
	)

	const displayValue = parseNumberValue(value, decimals, readonly)

	const classes = styles.useUtilityStyleTokens(
		StyleDefaults,
		props,
		"uesio/io.field"
	)

	return (
		<div className={classes.wrapper}>
			<input
				id={id}
				className={styles.cx(
					classes.input,
					readonly && classes.readonly
				)}
				type={type}
				onChange={onChange}
				onBlur={onBlur}
				disabled={readonly}
				placeholder={placeholder}
				step={options?.step}
				min={options?.min}
				max={options?.max}
				value={displayValue}
				title={`${displayValue}`}
			/>
			{type === "range" ? (
				<span className={classes.rangevalue}>{displayValue}</span>
			) : null}
		</div>
	)
}

export default NumberField
