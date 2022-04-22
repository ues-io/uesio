import { FunctionComponent } from "react"

import { FieldDefinition, FieldProps } from "./fielddefinition"
import { component, collection, wire, context } from "@uesio/ui"

const TextField = component.registry.getUtility("uesio/io.textfield")
const SelectField = component.registry.getUtility("uesio/io.selectfield")
const RadioButtonsField = component.registry.getUtility(
	"uesio/io.radiobuttonsfield"
)
const ToggleField = component.registry.getUtility("uesio/io.togglefield")
const CheckboxField = component.registry.getUtility("uesio/io.checkboxfield")
const MultiCheckField = component.registry.getUtility(
	"uesio/io.multicheckfield"
)
const ReferenceField = component.registry.getUtility("uesio/io.referencefield")
const FileText = component.registry.getUtility("uesio/io.filetext")
const FileImage = component.registry.getUtility("uesio/io.fileimage")
const FilePreview = component.registry.getUtility("uesio/io.filepreview")
const File = component.registry.getUtility("uesio/io.file")
const UserField = component.registry.getUtility("uesio/io.userfield")
const TimestampField = component.registry.getUtility("uesio/io.timestampfield")
const ListField = component.registry.getUtility("uesio/io.listfield")
const DateField = component.registry.getUtility("uesio/io.datefield")
const NumberField = component.registry.getUtility("uesio/io.numberfield")
const EmailField = component.registry.getUtility("uesio/io.emailfield")
const ReferenceGroupField = component.registry.getUtility(
	"uesio/io.referencegroupfield"
)
const MarkDownField = component.registry.getUtility("uesio/io.markdownfield")
const FileMarkDown = component.registry.getUtility("uesio/io.filemarkdown")

const FieldWrapper = component.registry.getUtility("uesio/io.fieldwrapper")

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
		case type === "LONGTEXT" && displayAs === "MARKDOWN":
			return <MarkDownField {...common} />
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
		case type === "FILE" && displayAs === "MARKDOWN":
			return <FileMarkDown {...common} />
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
