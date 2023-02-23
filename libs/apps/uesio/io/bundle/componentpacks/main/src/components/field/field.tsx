import { api, wire, definition, metadata, signal, collection } from "@uesio/ui"
import CheckboxField from "../../utilities/field/checkbox"
import DateField from "../../utilities/field/date"
import EmailField from "../../utilities/field/email"
import MarkDownField from "../../utilities/markdownfield/markdownfield"
import MultiCheckField from "../../utilities/field/multicheck"
import MultiSelectField from "../../utilities/field/multiselect"
import NumberField from "../../utilities/field/number"
import RadioButtons from "../../utilities/field/radiobuttons"
import ReferenceField from "../../utilities/field/reference"
import SelectField from "../../utilities/field/select"
import TextAreaField from "../../utilities/field/textarea"
import TextField from "../../utilities/field/text"
import TimestampField from "../../utilities/field/timestamp"
import ToggleField from "../../utilities/field/toggle"
import FieldWrapper from "../../utilities/fieldwrapper/fieldwrapper"
import UserField from "../../utilities/field/user"
import ListFieldDeck from "../../utilities/field/listdeck"
import ListField from "../../utilities/field/list"
import ReferenceGroupField from "../../utilities/field/referencegroup"
import { ReactNode } from "react"
import FileField from "../../utilities/field/file"
import MapField from "../../utilities/mapfield/mapfield"
import MapFieldDeck from "../../utilities/field/mapdeck"

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

type MapFieldOptions = {
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
	displayAs?: string
	reference?: ReferenceFieldOptions
	list?: ListFieldOptions
	map?: MapFieldOptions
	user?: UserFieldOptions
	number?: NumberFieldOptions
	longtext?: LongTextFieldOptions
	placeholder: string
	wrapperVariant: metadata.MetadataKey
} & definition.BaseDefinition

type LabelPosition = "none" | "top" | "left"

type UserFileMetadata = {
	[collection.ID_FIELD]: string
	["uesio/core.name"]: string
	["uesio/core.mimetype"]: string
	["uesio/core.path"]: string
	["uesio/core.recordid"]: string
	["uesio/core.collectionid"]: string
	["uesio/core.fieldid"]?: string
	["uesio/core.updatedat"]: string
}

const UPLOAD_FILE_EVENT = "component:uesio/io.field:upload"
const CANCEL_FILE_EVENT = "component:uesio/io.field:cancel"

const fileTextSignals: Record<string, signal.ComponentSignalDescriptor> = {
	UPLOAD_FILE: {
		dispatcher: (state, signal, context, platform, id) => {
			api.event.publish(UPLOAD_FILE_EVENT, { target: id })
			return state
		},
		label: "Upload File",
		properties: () => [],
	},
	CANCEL_FILE: {
		dispatcher: (state, signal, context, platform, id) => {
			api.event.publish(CANCEL_FILE_EVENT, { target: id })
			return state
		},
		label: "Cancel File",
		properties: () => [],
	},
}

const Field: definition.UC<FieldDefinition> = (props) => {
	const { context, definition, path } = props
	const {
		fieldId,
		placeholder,
		displayAs,
		reference,
		list,
		map,
		user,
		number,
		longtext,
	} = definition

	const componentId = api.component.getComponentIdFromProps(props)

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
		id: componentId,
		value: record.getFieldValue(fieldId),
		setValue: (value: wire.FieldValue) =>
			record.update(fieldId, value, context),
		record,
		variant: definition["uesio.variant"],
		placeholder,
	}

	let content: ReactNode
	let selectOptions: collection.SelectOption[]
	let multiSelectProps

	switch (fieldMetadata.getType()) {
		case "DATE":
			content = <DateField {...common} />
			break
		case "LONGTEXT":
			content =
				displayAs === "MARKDOWN" ? (
					<MarkDownField {...common} />
				) : (
					<TextAreaField {...common} options={longtext} />
				)
			break
		case "TEXT":
			content =
				displayAs === "PASSWORD" ? (
					<TextField {...common} password={true} />
				) : (
					<TextField {...common} />
				)
			break
		case "AUTONUMBER":
			content = <TextField {...common} />
			break
		case "NUMBER":
			content = <NumberField {...common} options={number} />
			break
		case "EMAIL":
			content = <EmailField {...common} />
			break
		case "SELECT": {
			selectOptions = fieldMetadata.getSelectOptions()
			content =
				displayAs === "RADIO" ? (
					<RadioButtons {...common} options={selectOptions} />
				) : (
					<SelectField {...common} options={selectOptions} />
				)
			break
		}
		case "MULTISELECT":
			multiSelectProps = {
				...common,
				options: fieldMetadata.getSelectOptions(),
				// Storage of Multiselect values in DB is a Map[string]boolean containing the values which are selected,
				// but the renderers expect a simple array of selected values, so we need to convert to/from that format
				setValue: (values: wire.PlainFieldValue[]) => {
					// Set the false/true value, then filter out the false values before setting
					common.setValue(
						values.reduce(
							(acc, val) => ({ ...acc, [val as string]: true }),
							{}
						)
					)
				},
				value: common.value
					? Object.keys(common.value as Record<string, boolean>)
					: [],
			}
			content =
				displayAs === "SELECT" ? (
					<MultiSelectField {...multiSelectProps} />
				) : (
					<MultiCheckField {...multiSelectProps} />
				)
			break
		case "CHECKBOX":
			content =
				displayAs === "TOGGLE" ? (
					<ToggleField {...common} />
				) : (
					<CheckboxField {...common} />
				)
			break
		case "REFERENCE":
			content = <ReferenceField {...common} options={reference} />
			break
		case "TIMESTAMP":
			content = <TimestampField {...common} />
			break
		case "FILE":
			content = <FileField {...common} displayAs={displayAs} />
			break
		case "USER":
			content = <UserField {...common} options={user} />
			break
		case "LIST":
			content =
				displayAs === "DECK" ? (
					<ListFieldDeck {...common} options={list} />
				) : (
					<ListField
						{...common}
						subFields={fieldMetadata.source.subfields}
						subType={fieldMetadata.source.subtype}
					/>
				)
			break
		case "MAP":
			content =
				displayAs === "DECK" ? (
					<MapFieldDeck {...common} options={map} />
				) : (
					<MapField
						{...common}
						keyField={{
							name: "key",
							label: "Label",
							type: "TEXT",
							namespace: "",
							accessible: true,
							createable: false,
							updateable: false,
						}}
						valueField={{
							name: "value",
							label: "Value",
							type: fieldMetadata.source
								.subtype as collection.FieldType,
							namespace: "",
							accessible: true,
							createable: false,
							updateable: false,
						}}
					/>
				)
			break
		case "REFERENCEGROUP":
			content = <ReferenceGroupField {...common} options={reference} />
			break
		default:
			content = null
	}

	return (
		<FieldWrapper
			label={label}
			labelPosition={definition.labelPosition}
			context={context}
			variant={definition.wrapperVariant}
			errors={errors}
		>
			{content}
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

Field.signals = fileTextSignals

export {
	fileTextSignals,
	UPLOAD_FILE_EVENT,
	CANCEL_FILE_EVENT,
	UserFileMetadata,
	LabelPosition,
	ListFieldOptions,
	MapFieldOptions,
	ReferenceFieldOptions,
	ReferenceGroupFieldOptions,
	UserFieldOptions,
	NumberFieldOptions,
	LongTextFieldOptions,
}

export default Field
