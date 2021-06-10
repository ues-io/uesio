import { FunctionComponent } from "react"

import { FieldProps } from "./fielddefinition"
import { component, collection, wire } from "@uesio/ui"

const TextField = component.registry.getUtility("io.textfield")
const SelectField = component.registry.getUtility("io.selectfield")
const CheckboxField = component.registry.getUtility("io.checkboxfield")
const ReferenceField = component.registry.getUtility("io.referencefield")
const FileText = component.registry.getUtility("io.filetext")
const FileUpload = component.registry.getUtility("io.fileupload")
const UserField = component.registry.getUtility("io.userfield")

const addBlankSelectOption = collection.addBlankSelectOption

const Field: FunctionComponent<FieldProps> = (props) => {
	const { context, definition } = props
	const { fieldId, hideLabel, id, displayAs } = definition

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

	const common = {
		context,
		mode,
		fieldMetadata,
		label,
		hideLabel,
		id,
		value: record.getFieldValue(fieldId),
		setValue: (value: wire.FieldValue) => record.update(fieldId, value),
		record,
		wire,
		variant: definition["uesio.variant"],
	}

	switch (true) {
		case type === "TEXT":
		case type === "LONGTEXT":
		case type === "DATE":
		case type === "NUMBER":
			return <TextField {...common} />
		case type === "SELECT":
			return (
				<SelectField
					{...common}
					options={addBlankSelectOption(
						fieldMetadata.getOptions() || []
					)}
				/>
			)
		case type === "CHECKBOX":
			return <CheckboxField {...common} />
		case type === "REFERENCE":
			return <ReferenceField {...common} />
		case type === "TIMESTAMP":
			return null
		case type === "FILE" && displayAs === "TEXT":
			return <FileText {...common} />
		case type === "FILE":
			return <FileUpload {...common} />
		case type === "USER":
			return <UserField {...common} />
		default:
			return null
	}
}

export default Field
