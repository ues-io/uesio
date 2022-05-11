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
	empty,
	toggleCondition,
} from "."
import saveWiresOp from "./operations/save"
import { runMany } from "../../signals/signals"
import loadWireOp from "./operations/load"
import { PlainWire } from "./types"
import { Context } from "../../context/context"
import WireRecord from "../wirerecord/class"
import { FieldValue, PlainWireRecord } from "../wirerecord/types"
import { nanoid } from "nanoid"

class Wire {
	constructor(source?: PlainWire) {
		this.source = source || ({} as PlainWire)
	}

	source: PlainWire
	collection: Collection

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

	getWireDef = () => {
		const wireDef = {
			events: {
				onChange: [
					{
						field: "uesio/viewonly.username",
						signals: [
							{
								signal: "user/TEST_USERNAME",
								username: "$Record{uesio/viewonly.username}",
								fieldId: "uesio/viewonly.username",
							},
						],
					},
				],
			},
		}

		return wireDef
	}

	doChanges = (recordId: string, path: string[]) => {
		// Get all signals under the field
		const signals = this.getWireDef().events.onChange.reduce(
			(prev, { field, signals }) => [
				...prev,
				...(path[0] === field ? signals : []),
			],
			[]
		)
		const context = new Context().addFrame({
			wire: this.source.name,
			record: recordId,
			view: this.source.view,
		})
		runMany(getStore().dispatch, "", signals, context)
	}

	updateRecord = (recordId: string, record: FieldValue, path: string[]) => {
		console.log({ recordId, record, path })
		getStore().dispatch(
			updateRecord({
				entity: this.getFullId(),
				recordId,
				record,
				path,
			})
		)
		this.doChanges(recordId, path)
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
