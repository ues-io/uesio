import { definition, styles, context, collection, wire } from "@uesio/ui"
import { ApplyChanges } from "../../components/field/field"
import { useControlledInputNumber } from "../../shared/useControlledFieldValue"

export type NumberFieldOptions = {
	step?: number
	max?: number
	min?: number
}

interface NumberFieldProps {
	applyChanges?: ApplyChanges
	setValue: (value: wire.FieldValue) => void
	value: wire.FieldValue
	fieldMetadata: collection.Field
	mode?: context.FieldMode
	options?: NumberFieldOptions
	placeholder?: string
	type?: "number" | "range"
	focusOnRender?: boolean
	readonly?: boolean
}

const StyleDefaults = Object.freeze({
	input: [],
	readonly: [],
	wrapper: ["flex"],
	rangevalue: ["p-2"],
})

const NumberField: definition.UtilityComponent<NumberFieldProps> = (props) => {
	const {
		mode,
		placeholder,
		fieldMetadata,
		id,
		options,
		setValue,
		type = "number",
		focusOnRender = false,
		applyChanges,
	} = props

	const value = props.value as number
	const readOnly = mode === "READ" || props.readonly
	const numberOptions = fieldMetadata?.getNumberMetadata()
	const decimals = numberOptions?.decimals ?? 2
	const initialValue =
		typeof value === "number"
			? (value as number).toFixed(decimals)
			: parseFloat(value)

	const controlledInputProps = useControlledInputNumber({
		value: initialValue,
		setValue,
		applyChanges,
		readOnly,
	})

	const classes = styles.useUtilityStyleTokens(
		StyleDefaults,
		props,
		"uesio/io.field"
	)
	return (
		<div
			className={styles.cx(classes.wrapper, readOnly && classes.readonly)}
		>
			<input
				id={id}
				className={classes.input}
				{...controlledInputProps}
				type={type}
				disabled={readOnly}
				placeholder={placeholder}
				step={options?.step}
				min={options?.min}
				max={options?.max}
				title={`${controlledInputProps.value}`}
				autoFocus={focusOnRender}
			/>
			{type === "range" ? (
				<span className={classes.rangevalue}>
					{controlledInputProps.value}
				</span>
			) : null}
		</div>
	)
}

export default NumberField
