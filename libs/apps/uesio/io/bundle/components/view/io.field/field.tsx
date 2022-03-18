import { FunctionComponent } from "react"

import { FieldDefinition, FieldProps } from "./fielddefinition"
import { component, collection, wire, context } from "@uesio/ui"

const TextField = component.registry.getUtility("io.textfield")
const SelectField = component.registry.getUtility("io.selectfield")
const RadioButtonsField = component.registry.getUtility("io.radiobuttonsfield")
const ToggleField = component.registry.getUtility("io.togglefield")
const CheckboxField = component.registry.getUtility("io.checkboxfield")
const MultiCheckField = component.registry.getUtility("io.multicheckfield")
const ReferenceField = component.registry.getUtility("io.referencefield")
const FileText = component.registry.getUtility("io.filetext")
const FileImage = component.registry.getUtility("io.fileimage")
const FilePreview = component.registry.getUtility("io.filepreview")
const File = component.registry.getUtility("io.file")
const UserField = component.registry.getUtility("io.userfield")
const TimestampField = component.registry.getUtility("io.timestampfield")
const ListField = component.registry.getUtility("io.listfield")
const DateField = component.registry.getUtility("io.datefield")
const NumberField = component.registry.getUtility("io.numberfield")
const EmailField = component.registry.getUtility("io.emailfield")
const ReferenceGroupField = component.registry.getUtility(
	"io.referencegroupfield"
)

const FieldWrapper = component.registry.getUtility("io.fieldwrapper")

const getFieldContent = (
	wire: wire.Wire,
	record: wire.WireRecord,
	definition: FieldDefinition,
	fieldMetadata: collection.Field,
	context: context.Context
) => {
	const { fieldId, id, displayAs, reference } = definition
	const canEdit = record.isNew()
		? fieldMetadata.getCreateable()
		: fieldMetadata.getUpdateable()

	const mode = (canEdit && context.getFieldMode()) || "READ"
	const type = fieldMetadata.getType()
	const common = {
		context,
		mode,
		fieldMetadata,
		id,
		value: record.getFieldValue(fieldId),
		setValue: (value: wire.FieldValue) => record.update(fieldId, value),
		record,
		wire,
		variant: definition["uesio.variant"],
	}

	switch (true) {
		case type === "DATE":
			return <DateField {...common} />
		case type === "LONGTEXT" || type === "TEXT" || type === "AUTONUMBER":
			return <TextField {...common} />
		case type === "NUMBER":
			return <NumberField {...common} />
		case type === "EMAIL":
			return <EmailField {...common} />
		case type === "SELECT" && displayAs === "RADIO":
			return (
				<RadioButtonsField
					{...common}
					options={fieldMetadata.getSelectOptions()}
				/>
			)
		case type === "SELECT":
			return (
				<SelectField
					{...common}
					options={fieldMetadata.getSelectOptions()}
				/>
			)
		case type === "MULTISELECT":
			return (
				<MultiCheckField
					{...common}
					options={fieldMetadata.getSelectOptions()}
				/>
			)
		case type === "CHECKBOX" && displayAs === "TOGGLE":
			return <ToggleField {...common} />
		case type === "CHECKBOX":
			return <CheckboxField {...common} />
		case type === "REFERENCE":
			return <ReferenceField {...common} options={reference} />
		case type === "TIMESTAMP":
			return <TimestampField {...common} />
		case type === "FILE" && displayAs === "TEXT":
			return <FileText {...common} />
		case type === "FILE" && displayAs === "IMAGE":
			return <FileImage {...common} />
		case type === "FILE" && displayAs === "PREVIEW":
			return <FilePreview {...common} />
		case type === "FILE":
			return <File {...common} />
		case type === "USER":
			return <UserField {...common} options={reference} />
		case type === "LIST":
			return (
				<ListField
					{...common}
					subFields={fieldMetadata.source.subfields}
					subType={fieldMetadata.source.subtype}
				/>
			)
		case type === "REFERENCEGROUP":
			return <ReferenceGroupField {...common} options={reference} />
		default:
			return null
	}
}

const Field: FunctionComponent<FieldProps> = (props) => {
	const { context, definition } = props
	const { fieldId } = definition

	const record = context.getRecord()
	const wire = context.getWire()
	if (!wire || !record) return null

	const collection = wire.getCollection()

	const fieldMetadata = collection.getField(fieldId)

	if (!fieldMetadata) return null

	const label = definition.label || fieldMetadata.getLabel()

	return (
		<FieldWrapper
			label={label}
			labelPosition={definition.labelPosition}
			context={context}
		>
			{getFieldContent(wire, record, definition, fieldMetadata, context)}
		</FieldWrapper>
	)
}

export default Field
