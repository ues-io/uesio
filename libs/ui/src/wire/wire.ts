import { PlainCollection } from "../bands/collection/types"
import Collection from "../bands/collection/class"
import { WireRecord, PlainWireRecord } from "./wirerecord"
import { WireConditionState } from "./wirecondition"
import { getStore } from "../store/store"
import { setRecord, updateRecord } from "../bands/wire"
import { PlainWire } from "../bands/wire/types"

class Wire {
	constructor(source?: PlainWire) {
		this.source = source || ({} as PlainWire)
	}

	source: PlainWire
	collection: Collection

	getId(): string {
		return this.source.name
	}

	getFullId(): string {
		return `${this.source.view}/${this.source.name}`
	}

	getCollection(): Collection {
		return this.collection
	}

	isMarkedForDeletion(recordId: string): boolean {
		return !!this.source.deletes[recordId]
	}

	getData(): WireRecord[] {
		return this.source?.data
			? Object.keys(this.source.data).map((id) => this.getRecord(id))
			: []
	}

	getViewId(): string {
		return this.source?.view
	}

	getRecord(id: string): WireRecord {
		return new WireRecord(this.source.data[id], id, this)
	}

	getFirstRecord(): WireRecord {
		const recordId = Object.keys(this.source.data)[0]
		return this.getRecord(recordId)
	}

	getConditions(): WireConditionState[] {
		return this.source.conditions || []
	}

	getCondition(id: string): WireConditionState | null {
		return this.getConditions().find((c) => c.id === id) || null
	}

	dispatchRecordUpdate(recordId: string, record: PlainWireRecord): void {
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

	dispatchRecordSet(recordId: string, record: PlainWireRecord): void {
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

	attachCollection(collection: PlainCollection): Wire {
		this.collection = new Collection(collection)
		return this
	}
}

export { Wire }
