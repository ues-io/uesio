import { FunctionComponent } from "react"

import { FieldDefinition, FieldProps } from "./fielddefinition"
import { component, collection, wire, context, definition } from "@uesio/ui"
const TextField = component.getUtility("uesio/io.textfield")
const SelectField = component.getUtility("uesio/io.selectfield")
const RadioButtonsField = component.getUtility("uesio/io.radiobuttonsfield")
const ToggleField = component.getUtility("uesio/io.togglefield")
const CheckboxField = component.getUtility("uesio/io.checkboxfield")
const MultiCheckField = component.getUtility("uesio/io.multicheckfield")
const ReferenceField = component.getUtility("uesio/io.referencefield")
const FileText = component.getUtility("uesio/io.filetext")
const FileImage = component.getUtility("uesio/io.fileimage")
const FileVideo = component.getUtility("uesio/io.filevideo")
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

type CommonProps = {
	mode: context.FieldMode
	fieldMetadata: collection.Field
	fieldId: string
	id?: string
	value: wire.FieldValue
	record: wire.WireRecord
	wire: wire.Wire
	setValue: (value: wire.FieldValue) => void
	placeholder?: string
} & definition.UtilityProps

const getFieldContent = (common: CommonProps, definition: FieldDefinition) => {
	const { displayAs, reference, list, user } = definition

	const fieldMetadata = common.fieldMetadata
	const type = fieldMetadata.getType()

	switch (type) {
		case "DATE":
			return <DateField {...common} />
		case "LONGTEXT": {
			if (displayAs === "MARKDOWN") return <MarkDownField {...common} />
			return <TextAreaField {...common} />
		}
		case "TEXT":
			if (displayAs === "PASSWORD")
				return <TextField {...common} password={true} />
			return <TextField {...common} />
		case "AUTONUMBER":
			return <TextField {...common} />
		case "NUMBER":
			return <NumberField {...common} />
		case "EMAIL":
			return <EmailField {...common} />
		case "SELECT": {
			const selectOptions = fieldMetadata.getSelectOptions()
			if (displayAs === "RADIO")
				return <RadioButtonsField {...common} options={selectOptions} />
			return <SelectField {...common} options={selectOptions} />
		}
		case "MULTISELECT": {
			const selectOptions = fieldMetadata.getSelectOptions()
			return <MultiCheckField {...common} options={selectOptions} />
		}
		case "CHECKBOX": {
			if (displayAs === "TOGGLE") return <ToggleField {...common} />
			return <CheckboxField {...common} />
		}
		case "REFERENCE":
			return <ReferenceField {...common} options={reference} />
		case "TIMESTAMP":
			return <TimestampField {...common} />
		case "FILE": {
			if (displayAs === "TEXT") return <FileText {...common} />
			if (displayAs === "IMAGE") return <FileImage {...common} />
			if (displayAs === "VIDEO") return <FileVideo {...common} />
			if (displayAs === "PREVIEW") return <FilePreview {...common} />
			if (displayAs === "MARKDOWN") return <FileMarkDown {...common} />
			return <File {...common} />
		}
		case "USER":
			return <UserField {...common} options={user} />
		case "LIST": {
			if (displayAs === "DECK")
				return <ListFieldDeck {...common} options={list} />
			return (
				<ListField
					{...common}
					subFields={fieldMetadata.source.subfields}
					subType={fieldMetadata.source.subtype}
				/>
			)
		}
		case "REFERENCEGROUP":
			return <ReferenceGroupField {...common} options={reference} />
		default:
			return null
	}
}

const Field: FunctionComponent<FieldProps> = (props) => {
	const { context, definition } = props
	const { fieldId, id, placeholder } = definition

	const record = context.getRecord()
	const wire = context.getWire()
	if (!wire || !record) return null

	const errors = record?.getErrors(fieldId)
	const collection = wire.getCollection()
	const fieldMetadata = collection.getField(fieldId)

	if (!fieldMetadata) return null

	const label = definition.label || fieldMetadata.getLabel()

	const canEdit = record.isNew()
		? fieldMetadata.getCreateable()
		: fieldMetadata.getUpdateable()

	const mode = (canEdit && context.getFieldMode()) || "READ"

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
		placeholder,
	}

	return (
		<FieldWrapper
			label={label}
			labelPosition={definition.labelPosition}
			context={context}
			variant={definition.wrapperVariant}
			errors={errors}
		>
			{getFieldContent(common, definition)}
		</FieldWrapper>
	)
}

export default Field
