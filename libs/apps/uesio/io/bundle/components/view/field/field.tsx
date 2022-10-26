import { FunctionComponent } from "react"

import { FieldDefinition, FieldProps } from "./fielddefinition"
import { component, collection, wire, context } from "@uesio/ui"
const TextField = component.getUtility("uesio/io.textfield")
const SelectField = component.getUtility("uesio/io.selectfield")
const RadioButtonsField = component.getUtility("uesio/io.radiobuttonsfield")
const ToggleField = component.getUtility("uesio/io.togglefield")
const CheckboxField = component.getUtility("uesio/io.checkboxfield")
const MultiCheckField = component.getUtility("uesio/io.multicheckfield")
const ReferenceField = component.getUtility("uesio/io.referencefield")
const FileText = component.getUtility("uesio/io.filetext")
const FileImage = component.getUtility("uesio/io.fileimage")
const FilePreview = component.getUtility("uesio/io.filepreview")
const File = component.getUtility("uesio/io.file")
const UserField = component.getUtility("uesio/io.userfield")
const TimestampField = component.getUtility("uesio/io.timestampfield")
const ListField = component.getUtility("uesio/io.listfield")
const ListFieldDeck = component.getUtility("uesio/io.listfielddeck")
const DateField = component.getUtility("uesio/io.datefield")
const NumberField = component.getUtility("uesio/io.numberfield")
const EmailField = component.getUtility("uesio/io.emailfield")
const ReferenceGroupField = component.getUtility("uesio/io.referencegroupfield")
const MarkDownField = component.getUtility("uesio/io.markdownfield")
const FileMarkDown = component.getUtility("uesio/io.filemarkdown")
const TextAreaField = component.getUtility("uesio/io.textareafield")

const FieldWrapper = component.getUtility("uesio/io.fieldwrapper")

const getFieldContent = (
	wire: wire.Wire,
	record: wire.WireRecord,
	definition: FieldDefinition,
	fieldMetadata: collection.Field,
	context: context.Context
) => {
	const {
		fieldId,
		id,
		displayAs,
		reference,
		options,
		placeholder,
		user,
		list,
	} = definition
	const canEdit = record.isNew()
		? fieldMetadata.getCreateable()
		: fieldMetadata.getUpdateable()

	const mode = (canEdit && context.getFieldMode()) || "READ"
	const type = fieldMetadata.getType()
	const common = {
		context,
		mode,
		fieldMetadata,
		fieldId,
		id,
		value: record.getFieldValue(fieldId),
		setValue: (value: wire.FieldValue) => record.update(fieldId, value),
		record,
		wire,
		variant:
			definition["uesio.variant"] || "uesio/io.field:uesio/io.default",
		options,
		placeholder,
	}

	switch (true) {
		case type === "DATE":
			return <DateField {...common} />
		case type === "LONGTEXT" && displayAs === "MARKDOWN":
			return <MarkDownField {...common} />
		case type === "LONGTEXT":
			return <TextAreaField {...common} />
		case type === "TEXT" && displayAs === "PASSWORD":
			return <TextField {...common} password={true} />
		case type === "TEXT" || type === "AUTONUMBER":
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
			return <UserField {...common} options={user} />
		case type === "LIST" && displayAs === "DECK":
			return <ListFieldDeck {...common} options={list} />
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
			wire={wire}
			record={record}
			fieldId={fieldId}
			variant={definition.wrapperVariant}
		>
			{getFieldContent(wire, record, definition, fieldMetadata, context)}
		</FieldWrapper>
	)
}

export default Field
