import { ChangeEvent, FunctionComponent } from "react"
import { definition, styles, context, collection, component } from "@uesio/ui"

interface DateFieldProps extends definition.UtilityProps {
	label?: string
	setValue: (value: string) => void
	value: string
	width?: string
	fieldMetadata: collection.Field
	hideLabel?: boolean
	mode?: context.FieldMode
}

const FieldLabel = component.registry.getUtility("io.fieldlabel")
const TextField = component.registry.getUtility("io.textfield")

const DateField: FunctionComponent<DateFieldProps> = (props) => {
	const { setValue, value, mode, hideLabel, options, label, context } = props

	const readonly = mode === "READ"

	if (mode === "READ") {
		if (props.value) {
			const timestamp = props.value
			const date = new Date(timestamp)
			const value = `${date.toLocaleDateString()}`
			return <TextField {...props} value={value} mode="READ" />
		}
		return <TextField {...props} mode="READ" />
	}

	const width = props.definition?.width as string
	const classes = styles.useUtilityStyles(
		{
			root: {
				...(width && { width }),
				padding: "16px",
			},
			input: {},
			readonly: {},
		},
		props
	)

	return (
		<div className={classes.root}>
			<FieldLabel label={label} hide={hideLabel} context={context} />
			<input
				value={value}
				type="date"
				disabled={readonly}
				onChange={(event: ChangeEvent<HTMLInputElement>): void =>
					setValue(event.target.value)
				}
			/>
		</div>
	)
}

export default DateField
