import { PlainCollection } from "../bands/collection/types"
import Collection from "../bands/collection/class"
import { WireRecord, PlainWireRecord } from "./wirerecord"
import { getStore } from "../store/store"
import { setRecord, updateRecord } from "../bands/wire"
import { PlainWire } from "../bands/wire/types"

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

	getData = () =>
		this.source?.data
			? Object.keys(this.source.data).map((id) => this.getRecord(id))
			: []

	getViewId = () => this.source?.view
	getRecord = (id: string) => new WireRecord(this.source.data[id], id, this)

	getFirstRecord = () => {
		const recordId = Object.keys(this.source.data)[0]
		return this.getRecord(recordId)
	}

	getConditions = () => this.source.conditions || []

	getCondition = (id: string) =>
		this.getConditions().find((c) => c.id === id) || null

	dispatchRecordUpdate = (recordId: string, record: PlainWireRecord) => {
		const idField = this.collection.getIdField()?.getId()
		if (!idField) return
		getStore().dispatch(
			updateRecord({
				entity: this.getFullId(),
				recordId,
				record,
				idField,
			})
		)
	}

	dispatchRecordSet = (recordId: string, record: PlainWireRecord) => {
		const idField = this.collection.getIdField()?.getId()
		if (!idField) return
		getStore().dispatch(
			setRecord({
				entity: this.getFullId(),
				recordId,
				record,
				idField,
			})
		)
	}

	attachCollection = (collection: PlainCollection) => {
		this.collection = new Collection(collection)
		return this
	}
}

export { Wire }
