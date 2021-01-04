import { PlainCollection } from "../collection/types"
import Collection from "../collection/class"
import { getStore } from "../../store/store"
import { setRecord, updateRecord } from "."
import saveWiresOp from "./operations/save"
import { PlainWire } from "./types"
import { Context } from "../../context/context"
import WireRecord from "../wirerecord/class"
import { PlainWireRecord } from "../wirerecord/types"

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

	dispatchRecordUpdate = async (
		recordId: string,
		record: PlainWireRecord
	) => {
		const idField = this.collection.getIdField()?.getId()
		if (!idField) {
			console.log("dispatchRecordUpdate", idField)
			return
		}
		const res = getStore().dispatch(
			updateRecord({
				entity: this.getFullId(),
				recordId,
				record,
				idField,
			})
		)
		return await Promise.resolve(res)
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

	save = async (context: Context) => {
		const res = await getStore().dispatch(
			saveWiresOp({ context, wires: [this.getId()] })
		)
		return res
	}
}

export default Wire
