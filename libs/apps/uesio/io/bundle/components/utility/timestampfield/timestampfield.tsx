import { FunctionComponent } from "react"
import { definition, context, collection, component } from "@uesio/ui"

interface TimestampFieldProps extends definition.UtilityProps {
	setValue: (value: string) => void
	value: number
	width?: string
	fieldMetadata: collection.Field
	mode?: context.FieldMode
}

const TextField = component.getUtility("uesio/io.textfield")

const TimestampField: FunctionComponent<TimestampFieldProps> = (props) => {
	if (props.value) {
		const timestamp = props.value
		const date = new Date(timestamp)
		const value = `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`
		return <TextField {...props} value={value} mode="READ" />
	}
	return <TextField {...props} mode="READ" />
}

export default TimestampField
