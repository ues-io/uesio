import { FunctionComponent } from "react"

import { FieldProps } from "./fielddefinition"
import { component, collection } from "@uesio/ui"

const TextField = component.registry.getUtility("io.textfield")
const SelectField = component.registry.getUtility("io.selectfield")
const ReferenceField = component.registry.getUtility("io.referencefield")

const addBlankSelectOption = collection.addBlankSelectOption

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
	const canEdit = record.isNew()
		? fieldMetadata.getCreateable()
		: fieldMetadata.getUpdateable()

	const mode = (canEdit && context.getFieldMode()) || "READ"
	const type = fieldMetadata.getType()

	if (["TEXT", "LONGTEXT", "DATE", "NUMBER"].indexOf(type) !== -1) {
		return (
			<TextField
				{...props}
				mode={mode}
				type={fieldMetadata.getType()}
				value={record.getFieldValue(fieldId) || ""}
				setValue={(value: string) => record.update(fieldId, value)}
				label={label}
				hideLabel={hideLabel}
				variant="io.default"
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
				variant="io.default"
				options={addBlankSelectOption(fieldMetadata.getOptions() || [])}
			/>
		)
	} else if (type === "CHECKBOX") {
		return null
	} else if (type === "REFERENCE") {
		return (
			<ReferenceField
				{...props}
				label={label}
				fieldMetadata={fieldMetadata}
				mode={mode}
				fieldId={fieldId}
				hideLabel={hideLabel}
				record={record}
				wire={wire}
			/>
		)
	} else if (type === "TIMESTAMP") {
		return null
	}
	return null
}

export default Field
