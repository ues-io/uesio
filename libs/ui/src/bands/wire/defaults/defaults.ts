import { nanoid } from "@reduxjs/toolkit"
import { Context, Mergeable } from "../../../context/context"
import { FieldValue, PlainWireRecord } from "../../wirerecord/types"
import { ID_FIELD } from "../../collection/types"
import set from "lodash/set"
import Wire from "../class"
import { DisplayCondition, shouldAll } from "../../../component/display"

const LOOKUP = "LOOKUP"
const VALUE = "VALUE"
const PARAM = "PARAM"
const SHORTID = "SHORTID"

type WireDefaultBase = {
  field: string
  valueSource?: typeof VALUE | typeof LOOKUP | typeof PARAM | typeof SHORTID
  conditions?: DisplayCondition[]
}

type ShortIDDefault = WireDefaultBase & {
  valueSource: typeof SHORTID
}

type LookupDefault = WireDefaultBase & {
  valueSource: typeof LOOKUP
  lookupWire: string
  lookupField?: string
}

type ValueDefault = WireDefaultBase & {
  valueSource: typeof VALUE
  value: FieldValue
}
type ParamDefault = WireDefaultBase & {
  valueSource: typeof PARAM
  param: string
}

type WireDefault = ValueDefault | LookupDefault | ParamDefault | ShortIDDefault

const getDefaultValue = (context: Context, item: WireDefault): FieldValue => {
  if (item.valueSource === LOOKUP) {
    const lookupWire = context.getWire(item.lookupWire)
    if (!lookupWire) return

    const firstRecord = lookupWire.getFirstRecord()
    if (!firstRecord || !item.lookupField) return

    return firstRecord.getFieldValue(item.lookupField)
  }
  if (item.valueSource === VALUE || !item.valueSource) {
    return context.merge(item.value as Mergeable)
  }

  if (item.valueSource === SHORTID) {
    return nanoid()
  }

  if (item.valueSource === PARAM) {
    return context.getParam(item.param)
  }
}

const getDefaultRecord = (context: Context, wire: Wire): PlainWireRecord => {
  const collection = wire.getCollection()
  const defaultRecord: PlainWireRecord = {}
  wire.getDefaults().forEach((defaultItem) => {
    if (!shouldAll(defaultItem.conditions, context)) return
    const value = getDefaultValue(context, defaultItem)
    const fieldName = defaultItem.field
    const field = collection.getField(fieldName)
    if (!field)
      throw new Error("No metadata for field in default: " + fieldName)

    const fieldNameParts = collection.getFieldParts(fieldName)

    if (field.isReference()) fieldNameParts.push(ID_FIELD)
    if (field.isReference() && !value) return

    set(defaultRecord, fieldNameParts, value)
  })
  return defaultRecord
}

export type { LookupDefault, ValueDefault, WireDefault }
export { getDefaultRecord }
