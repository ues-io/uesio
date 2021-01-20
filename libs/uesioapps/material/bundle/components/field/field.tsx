import React, { FunctionComponent } from "react"

import { FieldProps } from "./fielddefinition"
import Reference from "./reference"
import TextField from "../textfield/textfield"
import SelectField from "../selectfield/selectfield"
import CheckBoxField from "../checkboxfield/checkboxfield"

function toLocalISOString(d: Date) {
	const off = d.getTimezoneOffset()
	return new Date(
		d.getFullYear(),
		d.getMonth(),
		d.getDate(),
		d.getHours(),
		d.getMinutes() - off,
		d.getSeconds(),
		d.getMilliseconds()
	).toISOString()
}

function unixToISO(unixTimestamp: number) {
	const isoStr = toLocalISOString(new Date(unixTimestamp * 1e3))
	return isoStr.substring(0, isoStr.length - 1)
}

const Field: FunctionComponent<FieldProps> = (props) => {
	const { context, definition } = props
	const { fieldId, hideLabel } = definition

	const record = context.getRecord()
	const wire = context.getWire()
	if (!wire || !record) return null

	const collection = wire.getCollection()

	const fieldMetadata = collection.getField(fieldId)

	if (!fieldMetadata) return null

	const label = definition.label || fieldMetadata.getLabel()
	const mode = context.getFieldMode() || "READ"
	const type = fieldMetadata.getType()

	if (["TEXT", "LONGTEXT", "DATE", "NUMBER", "USER"].indexOf(type) !== -1) {
		return (
			<TextField
				{...props}
				mode={mode}
				type={fieldMetadata.getType()}
				value={record.getFieldValue(fieldId) || ""}
				setValue={(value) => record.update(fieldId, value)}
				label={label}
				hideLabel={hideLabel}
			/>
		)
	} else if (type === "SELECT") {
		return (
			<SelectField
				{...props}
				mode={mode}
				value={record.getFieldValue(fieldId) || ""}
				setValue={(value: string) => record.update(fieldId, value)}
				label={label}
				hideLabel={hideLabel}
				options={fieldMetadata.getOptions()}
			/>
		)
	} else if (type === "CHECKBOX") {
		return (
			<CheckBoxField
				{...props}
				mode={mode}
				value={record.getFieldValue(fieldId) || false}
				setValue={(value: boolean) => record.update(fieldId, value)}
				label={label}
				hideLabel={hideLabel}
			/>
		)
	} else if (type === "REFERENCE") {
		return (
			<Reference
				{...props}
				fieldMetadata={fieldMetadata}
				mode={mode}
				fieldId={fieldId}
				hideLabel={hideLabel}
				record={record}
				wire={wire}
			/>
		)
	} else if (type === "TIMESTAMP") {
		const timestamp = record.getFieldValue(fieldId) as number
		return (
			<TextField
				{...props}
				mode="READ"
				type={timestamp ? "datetime-local" : "text"}
				value={timestamp ? unixToISO(timestamp) : ""}
				setValue={(value) => record.update(fieldId, value)}
				label={label}
				hideLabel={hideLabel}
			/>
		)
	}
	return null
}

export default Field
