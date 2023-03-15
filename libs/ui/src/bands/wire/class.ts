import { PlainCollection } from "../collection/types"
import Collection from "../collection/class"
import { dispatch } from "../../store/store"
import { runMany } from "../../signals/signals"
import { shouldAll } from "../../componentexports"
import { WireEventType } from "../../definition/wire"
import {
	setRecord,
	createRecord,
	markForDelete,
	unmarkForDelete,
	cancel,
	empty,
	toggleCondition,
	setConditionValue,
	getFullWireId,
} from "."
import saveWiresOp from "./operations/save"
import loadWireOp from "./operations/load"
import { PlainWire } from "./types"
import { Context } from "../../context/context"
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
	hasAllRecords = () => !this.source?.more

	getErrors = () => this.source?.errors

	getErrorArray = () =>
		this.source?.errors &&
		Object.values(this.source.errors).flatMap((errgroup) => errgroup)

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

	createRecord = (
		record: PlainWireRecord,
		prepend?: boolean,
		recordId?: string
	) => {
		if (!recordId) recordId = nanoid()
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

	setConditionValue = (conditionId: string, value: FieldValue) => {
		dispatch(
			setConditionValue({
				entity: this.getFullId(),
				id: conditionId,
				value,
			})
		)
	}

	attachCollection = (collection: PlainCollection) => {
		this.collection = new Collection(collection)
		return this
	}

	save = (context: Context) => saveWiresOp(context, [this.getId()])

	load = (context: Context) => loadWireOp(context, [this.getId()], true)

	getEvents = () => this.source.events

	handleEvent(type: WireEventType, context: Context): void
	handleEvent(type: "onChange", context: Context, field: string): void
	handleEvent(type: string, context: Context, field?: string): void {
		const events = this.getEvents()
		if (!events) return

		// Backwards support
		if (!Array.isArray(events)) {
			if (!field || !context) return
			const changeEvents = events.onChange

			if (changeEvents) {
				for (const changeEvent of changeEvents) {
					if (changeEvent.field !== field) continue
					runMany(changeEvent.signals, context)
				}
			}
			return
		}

		// Todo: filter out events that can cause an infinite loop
		events
			.filter((event) => {
				// Is it the event we want?
				if (event.type !== type) return false
				// Is it a changeEvent? if so we need to do more checks
				if (event.type !== "onChange") return true
				// Does the changed field match the defined field?
				if (field && !event.fields?.includes(field)) return false
				return shouldAll(event.conditions, context)
			})
			.forEach((event) => {
				runMany(event?.signals || [], context)
			})
	}
}

export default Wire
