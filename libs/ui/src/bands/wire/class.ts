import { PlainCollection } from "../collection/types"
import Collection from "../collection/class"
import { getStore } from "../../store/store"
import {
	setRecord,
	updateRecord,
	createRecord,
	markForDelete,
	unmarkForDelete,
	cancel,
	clearRecordErrors,
	empty,
	toggleCondition,
} from "."
import saveWiresOp from "./operations/save"
import { runManyThrottled } from "../../signals/signals"
import loadWireOp from "./operations/load"
import { PlainWire } from "./types"
import { Context } from "../../context/context"
import WireRecord from "../wirerecord/class"
import { FieldValue, PlainWireRecord } from "../wirerecord/types"
import { nanoid } from "nanoid"
import { addError, removeError } from "./"
import { selectWire } from "./selectors"
import { selectors } from "../collection/adapter"
import Field from "../field/class"

class Wire {
	constructor(source?: PlainWire) {
		this.source = source || ({} as PlainWire)
		this.isValid = true
	}

	source: PlainWire
	collection: Collection
	isValid: boolean

	getId = () => this.source.name
	getFullId = () => `${this.source.view}/${this.source.name}`
	getCollection = () => this.collection
	isMarkedForDeletion = (recordId: string) => !!this.source.deletes[recordId]
	isViewOnly = () => this.source.viewOnly
	getBatchId = () => this.source.batchid

	getData = () =>
		this.source?.data
			? Object.keys(this.source.data).map((id) => this.getRecord(id))
			: []

	getErrors = () => this.source?.errors

	getViewId = () => this.source?.view
	getRecord = (id: string) => new WireRecord(this.source.data[id], id, this)

	getFirstRecord = () => {
		const recordId = Object.keys(this.source.data)[0]
		return this.getRecord(recordId)
	}

	getSize = () => Object.keys(this.source.data).length

	getConditions = () => this.source.conditions || []

	getCondition = (id: string) =>
		this.getConditions().find((c) => c.id === id) || null

	hasMore = () => this.source.more

	getWireDef = () => this.source.def

	doChanges = (recordId: string, path: string[]) => {
		const wireDef = this.getWireDef()
		const changeEvents = wireDef.events?.onChange

		if (changeEvents) {
			for (const changeEvent of changeEvents) {
				if (changeEvent.field !== path[0]) continue
				runManyThrottled(
					getStore().dispatch,
					"",
					changeEvent.signals,
					new Context().addFrame({
						wire: this.source.name,
						record: recordId,
						view: this.source.view,
					})
				)
			}
		}
	}

	invalidateFieldOnRecord = (
		recordId: string,
		fieldId: string,
		message: string
	) =>
		getStore().dispatch(
			addError({
				entity: this.getFullId(),
				recordId,
				fieldId,
				message,
			})
		)
	clearValidationErrorsOnRecord = (recordId: string) =>
		getStore().dispatch(
			clearRecordErrors({
				entity: this.getFullId(),
				recordId,
				fieldId: null,
			})
		)

	validateWireRecord = (
		recordId: string,
		recordData: PlainWireRecord,
		requiredFieldIds: string[],
		fields: [string, Field][],
		data: PlainWireRecord
	) => {
		this.clearValidationErrorsOnRecord(recordId)
		// 1. Get the changed fields and filter out empty strings
		const changedFields = Object.keys(recordData)

		// 2. Identify required but missing
		const missingButRequired = requiredFieldIds.filter((fieldId) => {
			if (changedFields.includes(fieldId)) return false // field is updated
			if (fieldId in data) return false // value was already in the wire load
			return true
		})
		missingButRequired.forEach((fieldId) =>
			this.invalidateFieldOnRecord(recordId, fieldId, "required")
		)
		// 3. Fields we can run validation on
		const fieldsToValidate = Object.entries(recordData).map(
			([fieldId, value]) => ({
				fieldId,
				value,
				recordId,
				field: fields.find(([id]) => id === fieldId)?.[1] as Field,
			})
		)
		fieldsToValidate.forEach((el) => this.validateRecordValue(el))
	}

	getFieldInstance = (fieldId: string) => {
		const state = getStore().getState()
		const plainCollection = selectors.selectById(
			state,
			this.source.collection
		)
		if (!plainCollection) return
		this.attachCollection(plainCollection)
		const collection = this.getCollection()

		return collection.getField(fieldId)
	}

	validate = () => {
		const state = getStore().getState()
		console.log("validate ire")
		// Create field tuples array for easy access later
		const collectionFieldData = Object.keys(this.getWireDef().fields)
			.map((fieldId) => {
				// Todo, we don't really want to do this in a loop
				const fieldInstance = this.getFieldInstance(fieldId)
				// if (!fieldInstance) return undefined
				return {
					fieldId,
					fieldInstance,
					required: fieldInstance?.getRequired(),
				}
			})
			.filter((x) => x) as {
			fieldId: string
			fieldInstance: Field
			required: boolean
		}[]
		const requiredFieldsIds = collectionFieldData.reduce(
			(prev, f) => [...prev, ...(f?.required ? [f.fieldId] : [])],
			[]
		)
		const fieldInstances: [string, Field][] = collectionFieldData.map(
			(f) => [f.fieldId, f.fieldInstance]
		)
		// Identify which records we need to validate
		const wireState = selectWire(state, this.getViewId(), this.getId())
		if (!wireState) return
		const changedRecordsIds = Object.entries(wireState.changes)

		changedRecordsIds.forEach(([recordId, keyValues]) =>
			this.validateWireRecord(
				recordId,
				keyValues,
				requiredFieldsIds,
				fieldInstances,
				wireState.data[recordId]
			)
		)
	}

	validateRecordValue = (fieldData: {
		recordId: string
		value: FieldValue
		fieldId: string
		field?: Field
	}) => {
		// validators
		const { recordId, value, fieldId, field } = fieldData
		const fieldInstance = field || this.getFieldInstance(fieldId)
		if (value === "uesio sucks")
			return this.invalidateFieldOnRecord(
				recordId,
				fieldId,
				"uesio is awesome"
			)
		// Required
		if (!value && fieldInstance?.source.required)
			return this.invalidateFieldOnRecord(
				recordId,
				fieldId,
				"this field is required"
			)

		// remove error from field
		return getStore().dispatch(
			removeError({
				entity: this.getFullId(),
				recordId,
				fieldId,
			})
		)
	}

	updateRecord = async (
		recordId: string,
		record: FieldValue,
		path: string[]
	) => {
		getStore().dispatch(
			updateRecord({
				entity: this.getFullId(),
				recordId,
				record,
				path,
			})
		)
		this.doChanges(recordId, path)
		this.validateRecordValue({
			recordId,
			value: record,
			fieldId: path[0],
		})
	}

	setRecord = (recordId: string, record: FieldValue, path: string[]) => {
		getStore().dispatch(
			setRecord({
				entity: this.getFullId(),
				recordId,
				record,
				path,
			})
		)
	}

	createRecord = (record: PlainWireRecord) => {
		const recordId = nanoid()
		getStore().dispatch(
			createRecord({
				entity: this.getFullId(),
				record,
				recordId,
			})
		)
		return this.getRecord(recordId)
	}

	markRecordForDeletion = (recordId: string) => {
		getStore().dispatch(
			markForDelete({
				entity: this.getFullId(),
				recordId,
			})
		)
	}

	setRecordValidity = (recordId: string) => {
		getStore().dispatch(
			markForDelete({
				entity: this.getFullId(),
				recordId,
			})
		)
	}

	unmarkRecordForDeletion = (recordId: string) => {
		getStore().dispatch(
			unmarkForDelete({
				entity: this.getFullId(),
				recordId,
			})
		)
	}

	cancel = () => {
		getStore().dispatch(
			cancel({
				entity: this.getFullId(),
			})
		)
	}

	empty = () => {
		getStore().dispatch(
			empty({
				entity: this.getFullId(),
			})
		)
	}

	toggleCondition = (conditionId: string) => {
		getStore().dispatch(
			toggleCondition({
				entity: this.getFullId(),
				conditionId,
			})
		)
	}

	attachCollection = (collection: PlainCollection) => {
		this.collection = new Collection(collection)
		return this
	}

	save = (context: Context) =>
		getStore().dispatch(saveWiresOp({ context, wires: [this.getId()] }))

	load = (context: Context) =>
		getStore().dispatch(loadWireOp({ context, wires: [this.getId()] }))
}

export default Wire
