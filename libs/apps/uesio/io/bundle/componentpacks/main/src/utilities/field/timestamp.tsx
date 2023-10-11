import { definition, styles, context, collection, wire } from "@uesio/ui"
import TextField from "./text"

interface TimestampFieldProps {
	setValue: (value: wire.FieldValue) => void
	value: wire.FieldValue
	width?: string
	fieldMetadata: collection.Field
	mode?: context.FieldMode
	readonly?: boolean
	focusOnRender?: boolean
}

const toTimestamp = (date: string) => {
	const datum = Date.parse(date)
	return datum / 1000
}

const datetimeLocal = (dt: Date) => {
	dt.setMinutes(dt.getMinutes() - dt.getTimezoneOffset())
	return dt.toISOString().slice(0, 19)
}

const StyleDefaults = Object.freeze({
	input: [],
	readonly: [],
})

const TimestampField: definition.UtilityComponent<TimestampFieldProps> = (
	props
) => {
	const { focusOnRender, setValue, mode, id } = props

	const timestamp = props.value as number
	const readonly = props.readonly || mode === "READ"
	const date = new Date(timestamp * 1000)

	if (readonly && timestamp) {
		const value = `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`
		return <TextField {...props} value={value} mode="READ" />
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
			value={timestamp ? datetimeLocal(date) : ""}
			type="datetime-local"
			step="1"
			disabled={readonly}
			onChange={(event) =>
				setValue(
					event.target.value ? toTimestamp(event.target.value) : null
				)
			}
			autoFocus={focusOnRender}
		/>
	)
}

export default TimestampField
