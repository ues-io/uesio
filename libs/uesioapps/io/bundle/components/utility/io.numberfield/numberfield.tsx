import { ChangeEvent, FunctionComponent } from "react"
import { definition, styles, context, collection, component } from "@uesio/ui"

interface NumberFieldProps extends definition.UtilityProps {
	label?: string
	setValue: (value: number | null) => void
	value: number
	width?: string
	fieldMetadata: collection.Field
	hideLabel?: boolean
	mode?: context.FieldMode
	placeholder?: string
	max: number
	min: number
	increment: number
}

const FieldLabel = component.registry.getUtility("io.fieldlabel")

const Defaults: collection.NumberMetadata = {
	decimals: 2,
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
		min,
		max,
		increment,
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

	const numberOptions = fieldMetadata?.getNumberMetadata()

	const decimals = numberOptions?.decimals ? numberOptions.decimals : 2
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
					setValue(
						event.target.value
							? parseFloat(event.target.value)
							: null
					)
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
