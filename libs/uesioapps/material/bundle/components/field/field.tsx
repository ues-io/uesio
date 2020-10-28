import * as React from "react"

import { FieldProps } from "./fielddefinition"
import Reference from "./reference"
import TextField from "../textfield/textfield"
import SelectField from "../selectfield/selectfield"
import CheckBoxField from "../checkboxfield/checkboxfield"

const Field = React.memo(
	(props: FieldProps): React.ReactElement | null => {
		const record = props.context.getRecord()
		const wire = props.context.getWire()
		if (!wire || !record) {
			return null
		}

		const collection = wire.getCollection()
		const fieldId = props.definition.fieldId
		const hideLabel = props.definition.hideLabel
		const fieldMetadata = collection.getField(fieldId)
		const label = props.definition.label || fieldMetadata.getLabel()

		const mode = props.context.getFieldMode() || "READ"

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

		if (type === "TEXT" || type === "LONGTEXT") {
			return (
				<TextField
					{...props}
					mode={mode}
					type={fieldMetadata.getType()}
					value={record.getFieldValue(fieldId) || ""}
					setValue={(value) => record.update(fieldId, value)}
					label={label}
					hideLabel={hideLabel}
				></TextField>
			)
		} else if (type === "DATE") {
			console.log("datetime", props)

			return (
				<TextField
					{...props}
					mode={mode}
					type={fieldMetadata.getType()}
					value={record.getFieldValue(fieldId) || ""}
					setValue={(value) => record.update(fieldId, value)}
					label={label}
					hideLabel={hideLabel}
				></TextField>
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
				></SelectField>
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
				></CheckBoxField>
			)
		} else if (type === "REFERENCE") {
			return <Reference {...rendererProps}></Reference>
		}
		return null
	},
	(oldProps, newProps) => {
		const oldContext = oldProps.context
		const newContext = newProps.context
		const sameRecord =
			oldContext.getRecord()?.source === newContext.getRecord()?.source
		const sameField =
			oldProps.definition.fieldId === newProps.definition.fieldId
		const sameMode = oldContext.getFieldMode() === newContext.getFieldMode()
		return sameRecord && sameField && sameMode
	}
)

Field.displayName = "Field"

export default Field
