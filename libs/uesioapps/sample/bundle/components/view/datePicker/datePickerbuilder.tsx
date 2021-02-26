import React, { FunctionComponent } from "react"
import DatePicker from "./datePicker"
import { hooks } from "@uesio/ui"
import { DatePickerProps, DatePickerDefinition } from "./datePickerdefinition"

const DatePickerBuilder: FunctionComponent<DatePickerProps> = (props) => {
	const uesio = hooks.useUesio(props)
	const definition = uesio.view.useDefinition(
		props.path
	) as DatePickerDefinition
	return <DatePicker {...props} definition={definition} />
}

export default DatePickerBuilder
