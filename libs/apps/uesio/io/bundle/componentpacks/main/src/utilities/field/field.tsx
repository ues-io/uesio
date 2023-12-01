import { ReactElement } from "react"
import { collection, definition, metadata, context, wire } from "@uesio/ui"

import CheckboxField, { CheckboxFieldOptions } from "./checkbox"
import DateField from "./date"
import MarkDownField, {
	MarkdownFieldOptions,
} from "../../utilities/markdownfield/markdownfield"
import MultiCheckField from "./multicheck"
import MultiSelectField from "./multiselect"
import NumberField, { NumberFieldOptions } from "./number"
import RadioButtons from "./radiobuttons"
import ReferenceField, { ReferenceFieldOptions } from "./reference"
import SelectField from "./select"
import TextAreaField, { LongTextFieldOptions } from "./textarea"
import TextField, { TextFieldOptions } from "./text"
import TimestampField from "./timestamp"
import ToggleField from "./toggle"
import UserField, { UserFieldOptions } from "./user"
import ListFieldDeck, { ListDeckOptions } from "./listdeck"
import ListField, { ListFieldOptions } from "./list"
import ReferenceGroupField, {
	ReferenceGroupFieldOptions,
} from "./referencegroup"
import FileField from "./file"
import MetadataField, { MetadataFieldOptions } from "./metadata"
import MapField, { MapFieldOptions } from "../../utilities/mapfield/mapfield"
import StructField, {
	StructFieldOptions,
} from "../../utilities/structfield/structfield"
import MapFieldDeck, { MapDeckOptions } from "./mapdeck"
import {
	ApplyChanges,
	FieldValueSetter,
	LabelPosition,
} from "../../components/field/field"
import MultiReferenceField from "./multireference"
interface FieldProps {
	setValue: FieldValueSetter
	value: wire.FieldValue
	mode: context.FieldMode
	placeholder?: string
	readonly?: boolean
	variant?: metadata.MetadataKey
	fieldMetadata: collection.Field
	fieldId: string
	id?: string
	path: string
	record: wire.WireRecord
	displayAs?: string
	focusOnRender?: boolean
	applyChanges?: ApplyChanges
	// if applyChanges is set to "onTypingComplete", this is the number of milliseconds
	// after the last keypress before setValue is invoked with the last value
	applyDelay?: number
	labelPosition?: LabelPosition
	// Type specific
	reference?: ReferenceFieldOptions | ReferenceGroupFieldOptions
	list?: ListFieldOptions | ListDeckOptions
	map?: MapFieldOptions | MapDeckOptions
	markdown?: MarkdownFieldOptions
	metadata?: MetadataFieldOptions
	number?: NumberFieldOptions
	longtext?: LongTextFieldOptions
	checkbox?: CheckboxFieldOptions
	user?: UserFieldOptions
	struct?: StructFieldOptions
	text?: TextFieldOptions
}

const Field: definition.UtilityComponent<FieldProps> = (props) => {
	const {
		applyChanges,
		applyDelay,
		checkbox,
		classes,
		context,
		displayAs,
		fieldId,
		fieldMetadata,
		focusOnRender,
		id,
		labelPosition,
		list,
		longtext,
		map,
		markdown,
		mode,
		number,
		path,
		placeholder,
		record,
		reference,
		setValue,
		struct,
		text,
		user,
		value,
		variant,
	} = props

	let readonly = false
	if (props.readonly !== undefined) {
		readonly = props.readonly
	} else if (fieldMetadata) {
		if (record?.isNew?.() && fieldMetadata.getCreateable() === false) {
			readonly = true
		} else if (
			(!record || !record?.isNew?.()) &&
			fieldMetadata.getUpdateable() === false
		) {
			readonly = true
		}
	}

	const common = {
		applyChanges,
		applyDelay,
		classes,
		context,
		fieldId,
		fieldMetadata,
		focusOnRender,
		id,
		labelPosition,
		mode,
		path,
		placeholder,
		readonly,
		record,
		setValue,
		value,
		variant,
	}

	const displayType = fieldMetadata.getType()
	const subType = fieldMetadata.getSubType() as collection.FieldType
	let mapFieldOptions: MapFieldOptions

	let selectOptions: wire.SelectOption[]
	let multiSelectProps
	let content: ReactElement
	const referenceMetadata = fieldMetadata.getReferenceMetadata()

	switch (displayType) {
		case "DATE":
			content = <DateField {...common} />
			break
		case "LONGTEXT":
			content =
				displayAs === "MARKDOWN" ? (
					<MarkDownField {...common} options={markdown} />
				) : (
					<TextAreaField {...common} options={longtext} />
				)
			break
		case "TEXT":
			content =
				displayAs === "PASSWORD" ? (
					<TextField {...common} options={text} type="password" />
				) : (
					<TextField {...common} options={text} />
				)
			break
		case "AUTONUMBER":
			content = <TextField {...common} />
			break
		case "NUMBER":
			content = (
				<NumberField
					{...common}
					options={number}
					type={displayAs === "SLIDER" ? "range" : "number"}
				/>
			)
			break
		case "SELECT": {
			selectOptions = fieldMetadata.getSelectOptions(context)
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
				options: fieldMetadata.getSelectOptions(context),
				// Storage of Multiselect values in DB is a Map[string]boolean containing the values which are selected,
				// but the renderers expect a simple array of selected values, so we need to convert to/from that format
				setValue: (values: wire.PlainFieldValue[]) => {
					values.length
						? common.setValue(
								values.reduce(
									(acc, val) => ({
										...acc,
										[val as string]: true,
									}),
									{}
								)
						  )
						: common.setValue(null)
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
			switch (displayAs) {
				case "TOGGLE":
					content = <ToggleField {...common} />
					break
				case "RADIO":
					content = (
						<RadioButtons
							{...common}
							options={[
								{
									value: "OFF",
									label: checkbox?.uncheckedLabel || "Off",
								},
								{
									value: "ON",
									label: checkbox?.checkedLabel || "On",
								},
							]}
							value={value ? "ON" : "OFF"}
							setValue={(value) => {
								common.setValue(value === "ON")
							}}
						/>
					)
					break
				default:
					content = <CheckboxField {...common} />
			}
			break
		case "METADATA":
		case "MULTIMETADATA":
			content = <MetadataField {...common} options={props.metadata} />
			break
		case "REFERENCE":
			referenceMetadata?.multicollection
				? (content = (
						<MultiReferenceField {...common} options={reference} />
				  ))
				: (content = <ReferenceField {...common} options={reference} />)
			break
		case "TIMESTAMP":
			content = <TimestampField {...common} />
			break
		case "FILE":
			content = (
				<FileField
					{...common}
					displayAs={displayAs}
					markdownOptions={markdown}
				/>
			)
			break
		case "USER":
			content = (
				<UserField {...common} options={user} refoptions={reference} />
			)
			break
		case "LIST":
			content =
				displayAs === "DECK" ? (
					<ListFieldDeck
						{...common}
						options={list as ListDeckOptions}
					/>
				) : (
					<ListField {...common} options={list as ListFieldOptions} />
				)
			break
		case "MAP":
			mapFieldOptions = (map || {}) as MapFieldOptions
			content =
				displayAs === "DECK" ? (
					<MapFieldDeck {...common} options={map as MapDeckOptions} />
				) : (
					<MapField
						{...common}
						options={{
							...mapFieldOptions,
							...{
								keyField: mapFieldOptions.keyField || {
									name: "key",
									label:
										mapFieldOptions.keyFieldLabel || "Key",
									type: "TEXT",
									namespace: "",
									accessible: true,
									createable: true,
									updateable: true,
								},
								valueField: mapFieldOptions.valueField || {
									name: "value",
									label:
										mapFieldOptions.valueFieldLabel ||
										"Value",
									type: subType,
									selectlist:
										fieldMetadata.getSelectMetadata(),
									number: fieldMetadata.getNumberMetadata(),
									subfields: fieldMetadata.getSubFields(),
									namespace: "",
									accessible: true,
									createable: true,
									updateable: true,
								},
							},
						}}
					/>
				)
			break
		case "STRUCT":
			content = (
				<StructField
					{...common}
					options={struct}
					value={value as wire.PlainWireRecord}
				/>
			)
			break
		case "REFERENCEGROUP":
			content = (
				<ReferenceGroupField
					{...common}
					options={reference as ReferenceGroupFieldOptions}
				/>
			)
			break
		default:
			content = <TextField {...common} />
	}

	return content
}

export default Field
