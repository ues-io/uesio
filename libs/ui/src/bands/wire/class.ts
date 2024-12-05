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
	reset,
	removeRecord,
} from "."
import saveWiresOp from "./operations/save"
import loadWireOp from "./operations/load"
import { PlainWire } from "./types"
import { Context } from "../../context/context"
import WireRecord from "../wirerecord/class"
import { FieldValue, PlainWireRecord } from "../wirerecord/types"
import { nanoid } from "@reduxjs/toolkit"
import { createRecordsOp } from "./operations/createrecord"

class Wire {
	constructor(source?: PlainWire) {
		this.source = source || ({} as PlainWire)
	}

	source: PlainWire
	collection: Collection

	getId = () => this.source.name
	getFullId = () => getFullWireId(this.source.view, this.source.name)
	getCollection = () => this.collection
	isMarkedForDeletion = (recordId: string) =>
		!!this.source.deletes?.[recordId]
	isChanged = (recordId: string) => !!this.source.changes?.[recordId]
	isViewOnly = () => this.source?.viewOnly || false
	getBatchId = () => this.source.batchid

	getData = () =>
		this.source?.data
			? Object.keys(this.source.data).map((id) => this.getRecord(id))
			: []

	getPlainData = () =>
		this.source?.data ? Object.values(this.source.data) : []

	getChanges = () =>
		Object.entries(this.source?.changes || {}).map(
			([id, changeObj]) => new WireRecord(changeObj, id, this)
		)

	getDeletes = () =>
		Object.entries(this.source?.deletes || {}).map(
			([id, deleteObj]) => new WireRecord(deleteObj, id, this)
		)

	/**
	 * Returns true if this Wire has any changes or deletes
	 * @returns boolean
	 */
	hasChanged = () =>
		Object.keys(this.source?.changes || {}).length > 0 ||
		Object.keys(this.source?.deletes || {}).length > 0

	hasAllRecords = () => !this.source?.more

	isLoading = () => !!this.source?.isLoading

	getErrors = () => this.source?.errors

	getErrorArray = () =>
		this.source?.errors &&
		Object.values(this.source.errors).flatMap((errgroup) => errgroup)

	getViewId = () => this.source?.view
	getRecord = (id: string) => new WireRecord(this.source.data[id], id, this)

	getFirstRecord = () => {
		if (!this.source.data) return undefined
		const keys = Object.keys(this.source.data)
		if (!keys || !keys.length) return undefined
		const recordId = keys[0]
		return this.getRecord(recordId)
	}

	getSize = () => Object.keys(this.source.data).length

	getConditions = () => this.source.conditions || []

	getDefaults = () => this.source.defaults || []

	getCondition = (id: string) =>
		this.getConditions().find((c) => c.id === id) || null

	hasMore = () => this.source.more

	getFields = () => this.source?.fields || []

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

	removeRecord = (recordId: string) => {
		dispatch(
			removeRecord({
				entity: this.getFullId(),
				recordId,
			})
		)
	}

	createRecord = (
		record: PlainWireRecord,
		prepend?: boolean,
		recordId?: string
	) => {
		// TODO: This code should be converted to using createRecordOp
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

	createRecords = ({
		context,
		records,
		prepend,
	}: {
		context: Context
		records: PlainWireRecord[]
		prepend?: boolean
	}) => createRecordsOp({ context, records, prepend, wireName: this.getId() })

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

	reset = () => {
		dispatch(
			reset({
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

	attachCollection = (collection: PlainCollection | undefined) => {
		if (this.isViewOnly() || !collection) {
			this.collection = new Collection(this.source.viewOnlyMetadata)
			return this
		}
		this.collection = new Collection({
			...collection,
			fields: {
				...collection.fields,
				...this.source.viewOnlyMetadata?.fields,
			},
		})
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
				// Is it a changeEvent? if so we need check if we care about the changed field
				if (
					event.type === "onChange" &&
					field &&
					!event.fields?.includes(field)
				)
					return false
				return shouldAll(event.conditions, context)
			})
			.forEach((event) => {
				runMany(event?.signals || [], context)
			})
	}
}

export default Wire
