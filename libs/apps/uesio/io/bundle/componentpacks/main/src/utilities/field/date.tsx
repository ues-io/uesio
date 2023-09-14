import { definition, styles, context, wire } from "@uesio/ui"
import TextField from "./text"
import { useControlledInput } from "../../shared/useControlledFieldValue"

type DateFieldProps = {
	setValue: (value: wire.FieldValue) => void
	value: wire.FieldValue
	mode?: context.FieldMode
	readonly?: boolean
	focusOnRender?: boolean
}

const StyleDefaults = Object.freeze({
	input: [],
	readonly: [],
})

const DateField: definition.UtilityComponent<DateFieldProps> = (props) => {
	const { focusOnRender = false, setValue, mode, id } = props

	const value = props.value as string
	const controlledInputProps = useControlledInput(value, setValue, "")

	const readonly = props.readonly || mode === "READ"

	if (readonly) {
		return (
			<TextField
				{...props}
				value={
					value
						? new Date(value).toLocaleDateString(undefined, {
								timeZone: "UTC",
						  })
						: ""
				}
				mode="READ"
			/>
		)
	}

	const classes = styles.useUtilityStyleTokens(
		StyleDefaults,
		props,
		"uesio/io.field"
	)

	return (
		<input
			id={id}
			className={styles.cx(classes.input, readonly && classes.readonly)}
			{...controlledInputProps}
			type="date"
			disabled={readonly}
			autoFocus={focusOnRender}
		/>
	)
}

export default DateField
