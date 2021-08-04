import { FunctionComponent } from "react"
import { definition, context, collection, component } from "@uesio/ui"

interface TimestampFieldProps extends definition.UtilityProps {
	label?: string
	setValue: (value: string) => void
	value: number
	width?: string
	fieldMetadata: collection.Field
	hideLabel?: boolean
	mode?: context.FieldMode
}

const TextField = component.registry.getUtility("io.textfield")

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
