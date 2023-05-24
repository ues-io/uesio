import { FunctionComponent, useEffect, useState } from "react"
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
	type?: "number" | "range"
}

const StyleDefaults = Object.freeze({
	input: [],
	readonly: [],
	wrapper: ["flex"],
	rangevalue: ["p-2"],
})

const parseNumberValue = (
	value: number | undefined,
	decimals: number,
	readonly: boolean
) => {
	const parsedValue = parseFloat(
		`${
			readonly && value !== undefined && typeof value === "number"
				? (value as number).toFixed(decimals)
				: value
		}`
	)
	if (!isNaN(parsedValue)) {
		return parsedValue
	} else {
		return undefined
	}
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
		value,
		type = "number",
	} = props
	const readonly = mode === "READ"
	const applyOnBlur = applyChanges === "onBlur"

	const classes = styles.useUtilityStyleTokens(
		StyleDefaults,
		props,
		"uesio/io.field"
	)

	const numberOptions = fieldMetadata?.getNumberMetadata()
	const decimals = numberOptions?.decimals || 2
	const [controlledValue, setControlledValue] = useState<number | undefined>(
		parseNumberValue(value as number, decimals, readonly)
	)
	useEffect(() => {
		const newValue = parseNumberValue(
			value as number,
			decimals,
			readonly
		) as number
		if (!isNaN(newValue) && newValue !== controlledValue) {
			setControlledValue(newValue)
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [value, decimals, readonly])

	// the input element will throw an error if a null/undefined value is provided to it,
	// so we need to provide an empty string if there is a non-numeric value for the field
	const displayValue = !(controlledValue && controlledValue !== 0)
		? ""
		: controlledValue

	return (
		<div className={classes.wrapper}>
			<input
				id={id}
				value={displayValue}
				className={styles.cx(
					classes.input,
					readonly && classes.readonly
				)}
				type={type}
				disabled={readonly}
				onChange={(e) => {
					const number = parseFloat(e.target.value)
					setControlledValue(number)
					!applyOnBlur && setValue?.(number)
				}}
				onBlur={() =>
					applyOnBlur &&
					parseNumberValue(value as number, decimals, readonly) !==
						controlledValue &&
					setValue?.(controlledValue)
				}
				placeholder={placeholder}
				step={options?.step}
				min={options?.min}
				max={options?.max}
				title={`${displayValue}`}
			/>
			{type === "range" ? (
				<span className={classes.rangevalue}>{displayValue}</span>
			) : null}
		</div>
	)
}

export default NumberField
