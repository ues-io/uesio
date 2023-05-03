import { FunctionComponent } from "react"
import { definition, styles, context, collection, wire } from "@uesio/ui"
import TextField from "./text"

interface TimestampFieldProps extends definition.UtilityProps {
	setValue: (value: wire.FieldValue) => void
	value: wire.FieldValue
	width?: string
	fieldMetadata: collection.Field
	mode?: context.FieldMode
}

const toTimestamp = (date: string) => {
	const datum = Date.parse(date)
	return datum / 1000
}

const datetimeLocal = (dt: Date) => {
	dt.setMinutes(dt.getMinutes() - dt.getTimezoneOffset())
	return dt.toISOString().slice(0, 16)
}

const StyleDefaults = Object.freeze({
	input: [],
	readonly: [],
})

const TimestampField: FunctionComponent<TimestampFieldProps> = (props) => {
	const { setValue, mode, id } = props

	const timestamp = props.value as number
	const readonly = mode === "READ"
	const date = new Date(timestamp * 1000)

	if (mode === "READ" && timestamp) {
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
			value={timestamp && datetimeLocal(date)}
			type="datetime-local"
			disabled={readonly}
			onChange={(event) =>
				setValue(
					event.target.value ? toTimestamp(event.target.value) : null
				)
			}
		/>
	)
}

export default TimestampField
