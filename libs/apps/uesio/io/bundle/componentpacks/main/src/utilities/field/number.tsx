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
		id,
		options,
		setValue,
		type = "number",
		focusOnRender = false,
		applyChanges,
	} = props

	const value = props.value as number | string
	const readonly = mode === "READ" || props.readonly

	const controlledInputProps = useControlledInputNumber(
		value,
		setValue,
		applyChanges
	)

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
				{...controlledInputProps}
				type={type}
				disabled={readonly}
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
