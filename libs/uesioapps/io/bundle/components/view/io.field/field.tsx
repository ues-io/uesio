import { FunctionComponent } from "react"

import { FieldProps } from "./fielddefinition"
import { component, collection } from "@uesio/ui"

const TextField = component.registry.getUtility("io.textfield")
const SelectField = component.registry.getUtility("io.selectfield")
const ReferenceField = component.registry.getUtility("io.referencefield")
const FileText = component.registry.getUtility("io.filetext")

const addBlankSelectOption = collection.addBlankSelectOption

const Field: FunctionComponent<FieldProps> = (props) => {
	const { context, definition } = props
	const { fieldId, hideLabel, id } = definition

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

	const commonProps = {
		...props,
		mode,
		fieldMetadata,
		label,
		hideLabel,
		variant: "io.default",
		id,
	}

	if (["TEXT", "LONGTEXT", "DATE", "NUMBER"].indexOf(type) !== -1) {
		return (
			<TextField
				{...commonProps}
				value={record.getFieldValue(fieldId) || ""}
				setValue={(value: string) => record.update(fieldId, value)}
			/>
		)
	} else if (type === "SELECT") {
		return (
			<SelectField
				{...commonProps}
				value={record.getFieldValue(fieldId) || ""}
				setValue={(value: string) => record.update(fieldId, value)}
				options={addBlankSelectOption(fieldMetadata.getOptions() || [])}
			/>
		)
	} else if (type === "CHECKBOX") {
		return null
	} else if (type === "REFERENCE") {
		return <ReferenceField {...commonProps} record={record} wire={wire} />
	} else if (type === "TIMESTAMP") {
		return null
	} else if (type === "FILE") {
		return <FileText {...commonProps} record={record} wire={wire} />
	}
	return null
}

export default Field
