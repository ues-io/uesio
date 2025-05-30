import {
  api,
  component,
  wire,
  definition,
  metadata,
  collection,
  styles,
} from "@uesio/ui"

import FieldWrapper from "../../utilities/fieldwrapper/fieldwrapper"
import FieldUtility from "../../utilities/field/field"

import { ListFieldOptions } from "../../utilities/field/list"
import { ListDeckOptions } from "../../utilities/field/listdeck"
import { StructFieldOptions } from "../../utilities/structfield/structfield"
import { LongTextFieldOptions } from "../../utilities/field/textarea"
import { NumberFieldOptions } from "../../utilities/field/number"
import { ReferenceFieldOptions } from "../../utilities/field/reference"
import { ReferenceGroupFieldOptions } from "../../utilities/field/referencegroup"
import { UserFieldOptions } from "../../utilities/field/user"
import { CheckboxFieldOptions } from "../../utilities/field/checkbox"
import { TextFieldOptions } from "../../utilities/field/text"
import { MetadataFieldOptions } from "../../utilities/field/metadata"
import { MapFieldOptions } from "../../utilities/mapfield/mapfield"
import { MapDeckOptions } from "../../utilities/field/mapdeck"

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
  list?: ListFieldOptions | ListDeckOptions
  map?: MapFieldOptions | MapDeckOptions
  metadata?: MetadataFieldOptions
  user?: UserFieldOptions
  number?: NumberFieldOptions
  longtext?: LongTextFieldOptions
  struct?: StructFieldOptions
  placeholder?: string
  readonly?: boolean
  text?: TextFieldOptions
  wrapperVariant: metadata.MetadataKey
  applyChanges?: ApplyChanges
  applyDelay?: number
}

type FieldValueSetter = (value: wire.FieldValue) => void

type ApplyChanges = "onBlur" | "onTypingComplete" | ""

type LabelPosition = "none" | "top" | "left" | "right"

type UserFileMetadata = {
  [collection.ID_FIELD]: string
  ["uesio/core.name"]: string
  ["uesio/core.mimetype"]: string
  ["uesio/core.path"]: string
  ["uesio/core.recordid"]: string
  ["uesio/core.collectionid"]: string
  ["uesio/core.fieldid"]?: string
  ["uesio/core.data"]?: string
  [collection.UPDATED_AT_FIELD]: string
}

const StyleDefaults = Object.freeze({
  wrapper: [],
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
    readonly,
    struct,
    text,
    wrapperVariant,
    labelPosition,
    applyChanges,
    applyDelay,
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
    ? collection.isCreateable() && fieldMetadata.getCreateable()
    : collection.isUpdateable() && fieldMetadata.getUpdateable()

  const mode = (canEdit && context.getFieldMode()) || "READ"
  const classes = styles.useStyleTokens(StyleDefaults, props)

  const common = {
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
    styleTokens: definition[component.STYLE_TOKENS],
    placeholder,
    displayAs,
    applyChanges,
    applyDelay,
    // Some components have sub-fields that need to know about label position
    labelPosition,
  }

  const typeSpecific = {
    reference,
    checkbox,
    list,
    map,
    metadata: definition.metadata,
    user,
    number,
    longtext,
    struct,
    text,
  }

  return (
    <FieldWrapper
      label={label}
      labelFor={componentId}
      classes={{ root: classes.wrapper }}
      labelPosition={labelPosition}
      context={context}
      variant={wrapperVariant}
      errors={errors}
    >
      <FieldUtility {...common} {...typeSpecific} />
    </FieldWrapper>
  )
}

export type {
  ApplyChanges,
  FieldValueSetter,
  UserFileMetadata,
  LabelPosition,
  ListDeckOptions,
  ListFieldOptions,
  MapFieldOptions,
  ReferenceFieldOptions,
  ReferenceGroupFieldOptions,
  UserFieldOptions,
  NumberFieldOptions,
  LongTextFieldOptions,
}

export default Field
