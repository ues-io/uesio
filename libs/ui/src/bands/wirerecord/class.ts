import get from "lodash/get"
import { Context } from "../../context/context"
import { ID_FIELD, UNIQUE_KEY_FIELD } from "../collection/types"
import Wire from "../wire/class"
import { FieldValue, PlainWireRecord } from "./types"
import updateRecordOp from "../wire/operations/updaterecord"
import { getFieldParts } from "../collection/class"

class WireRecord {
  constructor(source: PlainWireRecord, id: string, wire: Wire) {
    this.id = id
    this.source = source || ({} as PlainWireRecord)
    this.wire = wire
  }

  id: string
  source: PlainWireRecord
  wire: Wire

  getId = () => this.id
  getWire = () => this.wire
  getPlainData = () => this.source
  getCollection = () => this.wire?.getCollection()
  getFieldValue = <T extends FieldValue>(fieldName: string): T | undefined =>
    get(this.source, this.getFieldParts(fieldName))
  getFieldParts = (fieldName: string) =>
    getFieldParts(fieldName, this.getCollection()) || []
  getDateValue = (fieldName: string) => {
    const value = this.getFieldValue(fieldName)
    if (!value) return undefined
    // Dates are stored as strings
    if (typeof value === "string") return new Date(value)
    // Datetimes are store as numbers (seconds from epoch)
    if (typeof value === "number") return new Date(value * 1000)
    return undefined
  }
  getReferenceValue = (fieldName: string) => {
    const plain = this.getFieldValue<PlainWireRecord>(fieldName)
    if (!plain) return undefined
    return new WireRecord(plain, "", this.wire)
  }
  isNew = () => !this.getIdFieldValue()
  isEditable = () => this.getCollection()?.isUpdateable()
  isDeleteable = () => this.getCollection()?.isDeleteable()
  isDeleted = () => this.wire.isMarkedForDeletion(this.id)
  isChanged = () => this.wire.isChanged(this.id)

  getIdFieldValue = () => this.getFieldValue<string>(ID_FIELD)
  getUniqueKey = () => this.getFieldValue<string>(UNIQUE_KEY_FIELD)
  getNameFieldValue = () =>
    this.getFieldValue<string>(
      this.getCollection()?.getNameField()?.getId() || "",
    )

  getErrors = (fieldId: string) => {
    const wire = this.wire
    const errors = wire.getErrors()
    return errors?.[this.id + ":" + fieldId]
  }

  update = (fieldId: string, value: FieldValue, context: Context) =>
    updateRecordOp(context, this.getFieldParts(fieldId), value, this)

  set = (fieldId: string, value: FieldValue) =>
    this.wire.setRecord(this.id, value, this.getFieldParts(fieldId))

  setAll = (value: PlainWireRecord) => this.wire.setRecord(this.id, value, [])

  remove = () => this.wire.removeRecord(this.id)
}

export default WireRecord
