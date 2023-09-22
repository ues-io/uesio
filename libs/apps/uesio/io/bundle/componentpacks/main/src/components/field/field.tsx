import {
	api,
	component,
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
import { MapFieldOptions } from "../../utilities/mapfield/MapFieldOptions"
import {
	MarkdownComponentOptions,
	MarkdownFieldOptions,
} from "../../utilities/markdownfield/markdownfield"
import { NumberFieldOptions } from "../../utilities/field/number"
import { ReferenceFieldOptions } from "../../utilities/field/reference"
import { ReferenceGroupFieldOptions } from "../../utilities/field/referencegroup"
import { UserFieldOptions } from "../../utilities/field/user"
import { CheckboxFieldOptions } from "../../utilities/field/checkbox"

type FieldDefinition = {
	// Wire will default to the context wire, but can optionally be overridden
	wire?: string
	fieldId: string
	labelPosition?: LabelPosition
	label?: string
	displayAs?: string
	focusOnRender?: boolean
	reference?: ReferenceFieldOptions | ReferenceGroupFieldOptions
	checkbox?: CheckboxFieldOptions
	list?: ListFieldOptions
	map?: MapFieldOptions
	markdown?: MarkdownComponentOptions
	user?: UserFieldOptions
	number?: NumberFieldOptions
	longtext?: LongTextFieldOptions
	placeholder?: string
	readonly?: boolean
	wrapperVariant: metadata.MetadataKey
	subFieldVariant?: metadata.MetadataKey
	labelVariant?: metadata.MetadataKey
	applyChanges?: ApplyChanges
} & definition.BaseDefinition

type FieldValueSetter = (value: wire.FieldValue) => void

type ApplyChanges = "onBlur" | ""

type LabelPosition = "none" | "top" | "left" | "right"

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

const StyleDefaults = Object.freeze({
	input: [],
	readonly: [],
})

const Field: definition.UC<FieldDefinition> = (props) => {
	const { context, definition, path } = props
	const {
		wire: wireId,
		fieldId,
		placeholder,
		displayAs,
		focusOnRender,
		reference,
		checkbox,
		list,
		map,
		user,
		number,
		longtext,
		markdown: markdownComponentOptions,
		readonly,
		wrapperVariant,
		// Special variants used for Map/List/Struct fields
		subFieldVariant,
		labelVariant,
		labelPosition,
		applyChanges,
	} = definition

	const componentId = api.component.getComponentIdFromProps(props)

	const wire = context.getWire(wireId)

	if (!wire) return null

	const record = context.getRecord(wire.getId())

	if (!record) return null

	const errors = record?.getErrors(fieldId)
	const collection = wire.getCollection()
	const fieldMetadata = collection.getField(fieldId)

	if (!fieldMetadata) return null

	const label = definition.label || fieldMetadata.getLabel()

	const canEdit = record.isNew()
		? fieldMetadata.getCreateable()
		: fieldMetadata.getUpdateable()

	const mode = (canEdit && context.getFieldMode()) || "READ"
	const classes = styles.useStyleTokens(StyleDefaults, props)

	const common = {
		classes,
		readonly: readonly === true || mode === "READ",
		path,
		context,
		mode,
		fieldMetadata,
		fieldId,
		focusOnRender,
		id: componentId,
		value: record.getFieldValue(fieldId),
		setValue: (value: wire.FieldValue) =>
			record.update(fieldId, value, context),
		record,
		variant: definition[component.STYLE_VARIANT],
		placeholder,
		displayAs,
		subFieldVariant,
		labelVariant,
		applyChanges,
		// Some components have sub-fields that need to know about label position
		labelPosition,
	}

	let markdown: MarkdownFieldOptions | undefined
	if (markdownComponentOptions?.attachmentsWire) {
		const attachmentsWire = context.getWire(
			markdownComponentOptions?.attachmentsWire
		)
		if (attachmentsWire) {
			markdown = {
				attachments: attachmentsWire.getData() || [],
			}
		}
	}

	const typeSpecific = {
		reference,
		checkbox,
		list,
		map,
		markdown,
		user,
		number,
		longtext,
	}

	return (
		<FieldWrapper
			label={label}
			labelPosition={labelPosition}
			context={context}
			variant={wrapperVariant}
			errors={errors}
		>
			<FieldUtility {...common} {...typeSpecific} />
		</FieldWrapper>
	)
}

Field.signals = fileTextSignals

export { fileTextSignals, UPLOAD_FILE_EVENT, CANCEL_FILE_EVENT }

export type {
	ApplyChanges,
	FieldValueSetter,
	UserFileMetadata,
	LabelPosition,
	ListFieldOptions,
	MapFieldOptions,
	MarkdownFieldOptions,
	ReferenceFieldOptions,
	ReferenceGroupFieldOptions,
	UserFieldOptions,
	NumberFieldOptions,
	LongTextFieldOptions,
}

export default Field
