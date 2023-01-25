import { PlainCollection } from "../collection/types"
import Collection from "../collection/class"
import { dispatch } from "../../store/store"
import {
	setRecord,
	createRecord,
	markForDelete,
	unmarkForDelete,
	cancel,
	empty,
	toggleCondition,
	getFullWireId,
} from "."
import saveWiresOp from "./operations/save"
import loadWireOp from "./operations/load"
import updateRecordOp from "./operations/updaterecord"
import { PlainWire } from "./types"
import { Context, newContext } from "../../context/context"
import WireRecord from "../wirerecord/class"
import { FieldValue, PlainWireRecord } from "../wirerecord/types"
import { nanoid } from "@reduxjs/toolkit"

class Wire {
	constructor(source?: PlainWire) {
		this.source = source || ({} as PlainWire)
	}

	source: PlainWire
	collection: Collection

	getId = () => this.source.name
	getFullId = () => getFullWireId(this.source.view, this.source.name)
	getCollection = () => this.collection
	isMarkedForDeletion = (recordId: string) => !!this.source.deletes[recordId]
	isViewOnly = () => this.source?.viewOnly || false
	getBatchId = () => this.source.batchid

	getData = () =>
		this.source?.data
			? Object.keys(this.source.data).map((id) => this.getRecord(id))
			: []

	getChanges = () =>
		this.source?.changes
			? Object.keys(this.source.changes).map((id) => this.getRecord(id))
			: []

	isLoading = () => this.source?.isLoading

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

	getFields = () => this.source?.fields || {}

	updateRecord = (recordId: string, record: FieldValue, path: string[]) => {
		const context = newContext().addRecordFrame({
			wire: this.getId(),
			record: recordId,
			view: this.getViewId(),
		})
		updateRecordOp(context, path, record, this.source.name)
	}

	setRecord = (recordId: string, record: FieldValue, path: string[]) => {
		dispatch(
			setRecord({
				entity: this.getFullId(),
				recordId,
				record,
				path,
			})
		)
	}

	createRecord = (record: PlainWireRecord, prepend?: boolean) => {
		const recordId = nanoid()
		dispatch(
			createRecord({
				entity: this.getFullId(),
				record,
				recordId,
				prepend: !!prepend,
			})
		)
		return this.getRecord(recordId)
	}

	markRecordForDeletion = (recordId: string) => {
		dispatch(
			markForDelete({
				entity: this.getFullId(),
				recordId,
			})
		)
	}

	unmarkRecordForDeletion = (recordId: string) => {
		dispatch(
			unmarkForDelete({
				entity: this.getFullId(),
				recordId,
			})
		)
	}

	cancel = () => {
		dispatch(
			cancel({
				entity: this.getFullId(),
			})
		)
	}

	empty = () => {
		dispatch(
			empty({
				entity: this.getFullId(),
			})
		)
	}

	toggleCondition = (conditionId: string) => {
		dispatch(
			toggleCondition({
				entity: this.getFullId(),
				id: conditionId,
			})
		)
	}

	attachCollection = (collection: PlainCollection) => {
		this.collection = new Collection(collection)
		return this
	}

	save = (context: Context) => saveWiresOp(context, [this.getId()])

	load = (context: Context) => loadWireOp(context, [this.getId()])

	getEvents = () => this.source.events
}

export default Wire
