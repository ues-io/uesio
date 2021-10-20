import { FunctionComponent } from "react"

import { FieldProps } from "./fielddefinition"
import { component, collection, wire } from "@uesio/ui"

const TextField = component.registry.getUtility("io.textfield")
const SelectField = component.registry.getUtility("io.selectfield")
const ToggleField = component.registry.getUtility("io.togglefield")
const CheckboxField = component.registry.getUtility("io.checkboxfield")
const ReferenceField = component.registry.getUtility("io.referencefield")
const FileText = component.registry.getUtility("io.filetext")
const FileDynamic = component.registry.getUtility("io.filedynamic")
const UserField = component.registry.getUtility("io.userfield")
const TimestampField = component.registry.getUtility("io.timestampfield")
const ListField = component.registry.getUtility("io.listfield")
const DateField = component.registry.getUtility("io.datefield")
const NumberField = component.registry.getUtility("io.numberfield")
const EmailField = component.registry.getUtility("io.emailfield")

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
		setValue: (value: wire.FieldValue) => record.update(fieldId, value),
		record,
		wire,
		variant: definition["uesio.variant"],
	}

	switch (true) {
		case type === "DATE":
			return (
				<DateField
					{...common}
					value={record.getFieldValue<string>(fieldId)}
				/>
			)
		case type === "LONGTEXT" || type === "TEXT":
			return (
				<TextField
					{...common}
					value={record.getFieldValue<string>(fieldId)}
				/>
			)
		case type === "NUMBER":
			return (
				<NumberField
					{...common}
					value={record.getFieldValue<number>(fieldId)}
				/>
			)

		case type === "EMAIL":
			return (
				<EmailField
					{...common}
					value={record.getFieldValue<string>(fieldId)}
				/>
			)

		case type === "SELECT":
			return (
				<SelectField
					{...common}
					options={addBlankSelectOption(
						fieldMetadata.getOptions() || []
					)}
					value={record.getFieldValue<string>(fieldId)}
				/>
			)
		case type === "CHECKBOX" && displayAs === "TOGGLE":
			return (
				<ToggleField
					{...common}
					value={record.getFieldValue<wire.FieldValue>(fieldId)}
				/>
			)
		case type === "CHECKBOX":
			return (
				<CheckboxField
					{...common}
					value={record.getFieldValue<wire.FieldValue>(fieldId)}
				/>
			)
		case type === "REFERENCE":
			return <ReferenceField {...common} />
		case type === "TIMESTAMP":
			return (
				<TimestampField
					{...common}
					value={record.getFieldValue<number>(fieldId)}
				/>
			)
		case type === "FILE" && displayAs === "TEXT":
			return <FileText {...common} />
		case type === "FILE":
			return <FileDynamic {...common} />
		case type === "USER":
			return <UserField {...common} />
		case type === "LIST":
			return (
				<ListField
					{...common}
					subFields={fieldMetadata.source.subfields}
					subType={fieldMetadata.source.subtype}
					value={record.getFieldValue(fieldId)}
				/>
			)
		default:
			return null
	}
}

export default Field
