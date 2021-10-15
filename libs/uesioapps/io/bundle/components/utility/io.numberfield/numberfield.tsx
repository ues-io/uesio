import { ChangeEvent, FunctionComponent } from "react"
import { definition, styles, context, collection, component } from "@uesio/ui"

interface NumberFieldProps extends definition.UtilityProps {
	label?: string
	setValue: (value: number) => void
	value: number
	width?: string
	fieldMetadata: collection.Field
	hideLabel?: boolean
	mode?: context.FieldMode
	placeholder?: string
}

const FieldLabel = component.registry.getUtility("io.fieldlabel")

const Defaults: collection.NumberOptionsMetadata = {
	decimals: 2,
	max: 9999,
	min: 0,
	increment: 1,
}

const NumberField: FunctionComponent<NumberFieldProps> = (props) => {
	const {
		setValue,
		value,
		mode,
		hideLabel,
		context,
		label,
		placeholder,
		fieldMetadata,
	} = props
	const readonly = mode === "READ"
	const width = props.definition?.width as string
	const classes = styles.useUtilityStyles(
		{
			root: {
				...(width && { width }),
			},
			input: {},
			readonly: {},
		},
		props
	)

	const numberOptions = fieldMetadata.getNumberOptions()
	const min = numberOptions?.min ? numberOptions.min : Defaults.min
	const max = numberOptions?.max ? numberOptions.max : Defaults.max
	const increment = numberOptions?.increment
		? numberOptions?.increment
		: Defaults.increment
	const decimals = numberOptions?.decimals
		? numberOptions.decimals
		: Defaults.decimals
	const lvalue = readonly ? value.toFixed(decimals) : value

	return (
		<div className={classes.root}>
			<FieldLabel label={label} hide={hideLabel} context={context} />
			<input
				value={lvalue}
				className={styles.cx(
					classes.input,
					readonly && classes.readonly
				)}
				type="number"
				disabled={readonly}
				onChange={(event: ChangeEvent<HTMLInputElement>): void => {
					setValue(parseFloat(event.target.value))
				}}
				placeholder={placeholder}
				step={increment}
				min={min}
				max={max}
			/>
		</div>
	)
}

export default NumberField
