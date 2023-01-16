import {
	collection,
	wire,
	context,
	definition,
	metadata,
	signal,
} from "@uesio/ui"
import CheckboxField from "../../utilities/checkboxfield/checkboxfield"
import DateField from "../../utilities/datefield/datefield"
import EmailField from "../../utilities/emailfield/emailfield"
import MarkDownField from "../../utilities/markdownfield/markdownfield"
import MultiCheckField from "../../utilities/multicheckfield/multicheckfield"
import NumberField from "../../utilities/numberfield/numberfield"
import RadioButtons from "../../utilities/radiobuttonsfield/radiobuttonsfield"
import ReferenceField from "../../utilities/referencefield/referencefield"
import SelectField from "../../utilities/selectfield/selectfield"
import TextAreaField from "../../utilities/textareafield/textareafield"
import TextField from "../../utilities/textfield/textfield"
import TimestampField from "../../utilities/timestampfield/timestampfield"
import ToggleField from "../../utilities/togglefield/togglefield"
import FieldWrapper from "../../utilities/fieldwrapper/fieldwrapper"
import FileText from "../../utilities/filetext/filetext"
import FileImage from "../../utilities/fileimage/fileimage"
import FilePreview from "../../utilities/filepreview/filepreview"
import FileMarkDown from "../../utilities/filemarkdown/filemarkdown"
import FileVideo from "../../utilities/filevideo/filevideo"
import UserField from "../../utilities/userfield/userfield"
import ListFieldDeck from "../../utilities/listfielddeck/listfielddeck"
import ListField from "../../utilities/listfield/listfield"
import ReferenceGroupField from "../../utilities/referencegroupfield/referencegroupfield"
import { default as FileCmp } from "../../utilities/file/file"

type ReferenceGroupFieldOptions = {
	components?: definition.DefinitionList
	template?: string
}

type ReferenceFieldOptions = {
	searchFields?: string[]
	returnFields?: string[]
	components?: definition.DefinitionList
	template?: string
	requirewriteaccess?: boolean
}

type ListFieldOptions = {
	components?: definition.DefinitionList
}

type UserFieldOptions = {
	subtitle?: string
}

type NumberFieldOptions = {
	step?: number
	max?: number
	min?: number
}

type LongTextFieldOptions = {
	cols?: number
	rows?: number
}

type FieldDefinition = {
	fieldId: string
	labelPosition?: LabelPosition
	label?: string
	id?: string
	displayAs?: string
	reference?: ReferenceFieldOptions
	list?: ListFieldOptions
	user?: UserFieldOptions
	number?: NumberFieldOptions
	longtext?: LongTextFieldOptions
	placeholder: string
	wrapperVariant: metadata.MetadataKey
}

type LabelPosition = "none" | "top" | "left"

type FieldState = {
	value: string
	originalValue: string
	fieldId: string
	recordId: string
	collectionId: string
	fileName: string
	mimeType: string
}

const signals: Record<string, signal.ComponentSignalDescriptor<FieldState>> = {
	SAVE_FILE: {
		dispatcher: (state, signal, context, platform) => {
			const blob = new Blob([state.value], { type: state.mimeType })
			const fileName = state.fileName
			const file = new File([blob], fileName, {
				type: state.mimeType,
			})
			platform.uploadFile(
				context,
				file,
				state.collectionId,
				state.recordId,
				state.fieldId
			)
		},
		label: "Save File",
		properties: () => [],
	},
	CANCEL_FILE: {
		dispatcher: (state) => {
			state.value = state.originalValue
		},
		label: "Cancel File",
		properties: () => [],
	},
}

type CommonProps = {
	path: string
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
	const { displayAs, reference, list, user, number, longtext } = definition

	const fieldMetadata = common.fieldMetadata
	const type = fieldMetadata.getType()

	switch (type) {
		case "DATE":
			return <DateField {...common} />
		case "LONGTEXT": {
			if (displayAs === "MARKDOWN") return <MarkDownField {...common} />
			return <TextAreaField {...common} options={longtext} />
		}
		case "TEXT":
			if (displayAs === "PASSWORD")
				return <TextField {...common} password={true} />
			return <TextField {...common} />
		case "AUTONUMBER":
			return <TextField {...common} />
		case "NUMBER":
			return <NumberField {...common} options={number} />
		case "EMAIL":
			return <EmailField {...common} />
		case "SELECT": {
			const selectOptions = fieldMetadata.getSelectOptions()
			if (displayAs === "RADIO")
				return <RadioButtons {...common} options={selectOptions} />
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
			return <FileCmp {...common} />
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

const Field: definition.UC<FieldDefinition> = (props) => {
	const { context, definition, path } = props
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
		path,
		context,
		mode,
		fieldMetadata,
		fieldId,
		id,
		value: record.getFieldValue(fieldId),
		setValue: (value: wire.FieldValue) => record.update(fieldId, value),
		record,
		wire,
		variant: definition["uesio.variant"],
		placeholder,
		definition,
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

/*
const FieldPropertyDefinition: builder.BuildPropertiesDefinition = {
	title: "Field",
	description: "Just a Field",
	link: "https://docs.ues.io/",
	defaultDefinition: () => ({}),
	properties: [
		{
			name: "label",
			type: "TEXT",
			label: "Label",
		},
		{
			name: "labelPosition",
			type: "SELECT",
			label: "Label Position",
			options: [
				{
					label: "None",
					value: "none",
				},
				{
					label: "Top",
					value: "top",
				},
				{
					label: "Left",
					value: "left",
				},
			],
		},
		{
			name: "displayAs",
			type: "SELECT",
			label: "Display as",
			options: [
				{
					label: "MARKDOWN",
					value: "MARKDOWN",
				},
				{
					label: "PASSWORD",
					value: "PASSWORD",
				},
				{
					label: "RADIO",
					value: "RADIO",
				},
				{
					label: "TOGGLE",
					value: "TOGGLE",
				},
				{
					label: "TEXT",
					value: "TEXT",
				},
				{
					label: "IMAGE",
					value: "IMAGE",
				},
				{
					label: "VIDEO",
					value: "VIDEO",
				},
				{
					label: "PREVIEW",
					value: "PREVIEW",
				},
			],
		},
		{
			name: "id",
			type: "TEXT",
			label: "ID",
		},
	],
	sections: [],
	actions: [],
	type: "component",
	classes: ["root"],
}
*/

Field.signals = signals

export {
	FieldState,
	LabelPosition,
	ListFieldOptions,
	ReferenceFieldOptions,
	ReferenceGroupFieldOptions,
	UserFieldOptions,
	NumberFieldOptions,
	LongTextFieldOptions,
}

export default Field
