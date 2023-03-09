import {
	api,
	wire,
	definition,
	metadata,
	signal,
	collection,
	styles,
} from "@uesio/ui"

import FieldWrapper from "../../utilities/fieldwrapper/fieldwrapper"
import FieldUtility from "../../utilities/field/field"

import { ListFieldOptions } from "../../utilities/field/listdeck"
import { LongTextFieldOptions } from "../../utilities/field/textarea"
import { MapFieldOptions } from "../../utilities/field/mapdeck"
import { NumberFieldOptions } from "../../utilities/field/number"
import { ReferenceFieldOptions } from "../../utilities/field/reference"
import { ReferenceGroupFieldOptions } from "../../utilities/field/referencegroup"
import { UserFieldOptions } from "../../utilities/field/user"

type FieldDefinition = {
	fieldId: string
	labelPosition?: LabelPosition
	label?: string
	displayAs?: string
	reference?: ReferenceFieldOptions | ReferenceGroupFieldOptions
	list?: ListFieldOptions
	map?: MapFieldOptions
	user?: UserFieldOptions
	number?: NumberFieldOptions
	longtext?: LongTextFieldOptions
	placeholder?: string
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
	},
	CANCEL_FILE: {
		dispatcher: (state, signal, context, platform, id) => {
			api.event.publish(CANCEL_FILE_EVENT, { target: id })
			return state
		},
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
	const classes = styles.useStyles(
		{
			input: {},
			readonly: {},
		},
		props
	)

	const readonly = mode === "READ"

	const common = {
		classes,
		readonly,
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
		displayAs,
	}
	const typeSpecific = {
		reference,
		list,
		map,
		user,
		number,
		longtext,
	}

	return (
		<FieldWrapper
			label={label}
			labelPosition={definition.labelPosition}
			context={context}
			variant={definition.wrapperVariant}
			errors={errors}
		>
			<FieldUtility {...common} {...typeSpecific} />
		</FieldWrapper>
	)
}

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
