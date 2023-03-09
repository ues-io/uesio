import { FunctionComponent, ReactElement } from "react"
import { collection, definition, metadata, context, wire } from "@uesio/ui"

import CheckboxField from "../../utilities/field/checkbox"
import DateField from "../../utilities/field/date"
import EmailField from "../../utilities/field/email"
import MarkDownField from "../../utilities/markdownfield/markdownfield"
import MultiCheckField from "../../utilities/field/multicheck"
import MultiSelectField from "../../utilities/field/multiselect"
import NumberField, { NumberFieldOptions } from "../../utilities/field/number"
import RadioButtons from "../../utilities/field/radiobuttons"
import ReferenceField, {
	ReferenceFieldOptions,
} from "../../utilities/field/reference"
import SelectField from "../../utilities/field/select"
import TextAreaField, {
	LongTextFieldOptions,
} from "../../utilities/field/textarea"
import TextField from "../../utilities/field/text"
import TimestampField from "../../utilities/field/timestamp"
import ToggleField from "../../utilities/field/toggle"
import UserField, { UserFieldOptions } from "../../utilities/field/user"
import ListFieldDeck, { ListFieldOptions } from "../../utilities/field/listdeck"
import ListField from "../../utilities/field/list"
import ReferenceGroupField, {
	ReferenceGroupFieldOptions,
} from "../../utilities/field/referencegroup"
import FileField from "../../utilities/field/file"
import MapField from "../../utilities/mapfield/mapfield"
import MapFieldDeck from "../../utilities/field/mapdeck"
import { MapFieldOptions } from "../../components/field/field"

interface FieldProps extends definition.UtilityProps {
	setValue: (value: wire.FieldValue) => void
	value: wire.FieldValue
	mode: context.FieldMode
	placeholder?: string
	variant?: metadata.MetadataKey
	fieldMetadata: collection.Field
	fieldId: string
	id?: string
	path: string
	record: wire.WireRecord
	displayAs?: string
	// Type specific
	reference?: ReferenceFieldOptions | ReferenceGroupFieldOptions
	list?: ListFieldOptions
	map?: MapFieldOptions
	number?: NumberFieldOptions
	longtext?: LongTextFieldOptions
	user?: UserFieldOptions
}

const Field: FunctionComponent<FieldProps> = (props) => {
	const {
		reference,
		list,
		map,
		user,
		number,
		longtext,
		context,
		displayAs,
		setValue,
		mode,
		placeholder,
		id,
		path,
		fieldId,
		fieldMetadata,
		record,
		value,
		variant,
		classes,
	} = props

	const common = {
		classes,
		path,
		context,
		mode,
		fieldMetadata,
		fieldId,
		id,
		record,
		setValue,
		variant,
		value,
		placeholder,
	}

	let selectOptions: collection.SelectOption[]
	let multiSelectProps
	let content: ReactElement

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
			content = (
				<ReferenceField
					{...common}
					options={reference as ReferenceFieldOptions}
				/>
			)
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
						options={list}
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
