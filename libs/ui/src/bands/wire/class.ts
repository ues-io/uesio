import { PlainCollection } from "../collection/types"
import Collection from "../collection/class"
import { appDispatch } from "../../store/store"
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
import { nanoid } from "nanoid"
import { DisplayCondition } from "../../componentexports"

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
	isViewOnly = () => this.source.viewOnly
	getBatchId = () => this.source.batchid

	getData = (context?: Context, filter?: DisplayCondition[]) => {
		if (filter) {
			console.log({ filter })
			console.log({ wire: this.source }) //contacts
			console.log({ context: context?.stack })

			const test = context?.merge("${uesio/crm.name}")

			console.log({ test })

			//GET the value of the context Wire --> feild
			//maybe usewire()???
			//const wire = context?.getWire("accounts") //from the filter contextWire
			//const record = wire?.getRecord("uesio/core.id") //from the filter contextField
			//console.log(wire?.source.data)

			// const contextValue = "Acme Toothbrush Co ben is cool!!"
			// //filter the this.source?.data using that value
			// const field = "uesio/crm.firstname"

			// wire: contacts
			// field: uesio/crm.firstname
			// operator: EQUALS
			// contextWire: accounts
			// contextField: uesio/crm.name

			// console.log("To Filter")
			// console.log(this.source?.data)

			// console.log("FILTER")
			// return this.source?.data
			// 	? Object.keys(this.source.data)
			// 			.map((id) => {
			// 				const record = this.source.data[id]
			// 				if (record[field] === contextValue)
			// 					return this.getRecord(id)
			// 				return null
			// 			})
			// 			.filter((x) => x)
			// 	: []
		}

		return this.source?.data
			? Object.keys(this.source.data).map((id) => this.getRecord(id))
			: []
	}

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

	getFields = () => this.getWireDef().fields

	updateRecord = (recordId: string, record: FieldValue, path: string[]) => {
		const context = newContext({
			wire: this.getId(),
			record: recordId,
			view: this.getViewId(),
		})
		appDispatch()(updateRecordOp(context, path, record))
	}

	setRecord = (recordId: string, record: FieldValue, path: string[]) => {
		appDispatch()(
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
		appDispatch()(
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
		appDispatch()(
			markForDelete({
				entity: this.getFullId(),
				recordId,
			})
		)
	}

	unmarkRecordForDeletion = (recordId: string) => {
		appDispatch()(
			unmarkForDelete({
				entity: this.getFullId(),
				recordId,
			})
		)
	}

	cancel = () => {
		appDispatch()(
			cancel({
				entity: this.getFullId(),
			})
		)
	}

	empty = () => {
		appDispatch()(
			empty({
				entity: this.getFullId(),
			})
		)
	}

	toggleCondition = (conditionId: string) => {
		appDispatch()(
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

	save = (context: Context) =>
		appDispatch()(saveWiresOp(context, [this.getId()]))

	load = (context: Context) =>
		appDispatch()(loadWireOp(context, [this.getId()]))
}

export default Wire
