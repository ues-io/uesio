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
}

const StyleDefaults = Object.freeze({
	input: [],
	readonly: [],
})

const parseNumberValue = (
	value: number | undefined = 0,
	decimals: number,
	readonly: boolean
) =>
	parseFloat(
		`${
			readonly && value !== undefined && typeof value === "number"
				? (value as number).toFixed(decimals)
				: value
		}`
	)

const NumberField: FunctionComponent<NumberFieldProps> = (props) => {
	const {
		mode,
		placeholder,
		fieldMetadata,
		id,
		options,
		setValue,
		applyChanges,
		value = 0,
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
	const [controlledValue, setControlledValue] = useState<number>(
		parseNumberValue(value as number, decimals, readonly)
	)
	useEffect(() => {
		const newValue = parseNumberValue(
			value as number,
			decimals,
			readonly
		) as number
		setControlledValue(newValue)
	}, [value, decimals, readonly])

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
				parseNumberValue(value as number, decimals, readonly) !==
					controlledValue &&
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
