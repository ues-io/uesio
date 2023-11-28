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
	const readOnly = props.readonly || mode === "READ"
	const controlledInputProps = useControlledInput({
		value,
		setValue,
		readOnly,
	})

	if (readOnly) {
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
			className={styles.cx(classes.input, readOnly && classes.readonly)}
			{...controlledInputProps}
			type="date"
			disabled={readOnly}
			autoFocus={focusOnRender}
		/>
	)
}

export default DateField
