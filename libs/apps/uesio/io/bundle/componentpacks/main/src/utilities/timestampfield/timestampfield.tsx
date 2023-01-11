import { FunctionComponent } from "react"
import { definition, context, collection, wire } from "@uesio/ui"
import TextField from "../textfield/textfield"

interface TimestampFieldProps extends definition.UtilityProps {
	setValue: (value: string) => void
	value: wire.FieldValue
	width?: string
	fieldMetadata: collection.Field
	mode?: context.FieldMode
}

const TimestampField: FunctionComponent<TimestampFieldProps> = (props) => {
	if (props.value) {
		const timestamp = props.value as number
		const date = new Date(timestamp * 1000)
		const value = `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`
		return <TextField {...props} value={value} mode="READ" />
	}
	return <TextField {...props} mode="READ" />
}

export default TimestampField
