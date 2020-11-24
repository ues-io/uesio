import React from "react"

import { FieldProps } from "./fielddefinition"
import Reference from "./reference"
import TextField from "../textfield/textfield"
import SelectField from "../selectfield/selectfield"
import CheckBoxField from "../checkboxfield/checkboxfield"

const Field = (props: FieldProps): React.ReactElement | null => {
	const { context, definition } = props
	const { fieldId, hideLabel } = definition

	const record = context.getRecord()
	const wire = context.getWire()
	if (!wire || !record) {
		return null
	}

	const collection = wire.getCollection()

	const fieldMetadata = collection.getField(fieldId)
	const label = definition.label || fieldMetadata.getLabel()
	const mode = context.getFieldMode() || "READ"

	if (!fieldMetadata.isValid()) {
		return null
	}

	const type = fieldMetadata.getType()

	const rendererProps = {
		fieldMetadata,
		mode,
		fieldId,
		hideLabel,
		record,
		wire,
		...props,
	}

	if (["TEXT", "LONGTEXT", "DATE"].indexOf(type) !== -1) {
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
		return <Reference {...rendererProps} />
	}
	return null
}

Field.displayName = "Field"

export default Field
