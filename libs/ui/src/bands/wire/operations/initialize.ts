import { ThunkFunc } from "../../../store/store"
import { Context } from "../../../context/context"
import { init, selectWire } from ".."
import {
	RegularWireDefinition,
	ViewOnlyWireDefinition,
	WireDefinition,
} from "../../../definition/wire"
import { PlainWire } from "../types"
import { PlainCollection, PlainCollectionMap } from "../../collection/types"
import { PlainWireRecord } from "../../wirerecord/types"
import { FieldMetadataMap } from "../../field/types"
import createrecord from "./createrecord"

const initializeRegularWire = (
	viewId: string,
	wirename: string,
	wireDef: RegularWireDefinition
): PlainWire => ({
	view: viewId || "",
	query: !wireDef.init || wireDef.init.query || false,
	name: wirename,
	conditions: wireDef.conditions,
	batchid: "",
	batchnumber: 0,
	data: {},
	order: wireDef.order,
	collection: wireDef.collection,
	viewOnly: false,
	fields: wireDef.fields,
	create: !wireDef.init || wireDef.init.create || false,
	defaults: wireDef.defaults,
	events: wireDef.events,
	batchsize: wireDef.batchsize,
	requirewriteaccess: wireDef.requirewriteaccess,
})

const initializeViewOnlyWire = (
	viewId: string,
	wirename: string,
	wireDef: ViewOnlyWireDefinition,
	metadata: PlainCollectionMap
): PlainWire => {
	const viewOnlyNamespace = "uesio/viewonly"
	const fieldMetadata: FieldMetadataMap = {
		"uesio/core.id": {
			accessible: true,
			createable: false,
			name: "id",
			updateable: false,
			namespace: "uesio/core",
			type: "TEXT",
			label: "ID",
		},
	}
	Object.keys(wireDef.fields).forEach((field) => {
		const fieldDef = wireDef.fields[field]

		fieldMetadata[field] = {
			accessible: true,
			createable: true,
			name: field,
			updateable: true,
			namespace: viewOnlyNamespace,
			type: fieldDef.type,
			label: fieldDef.label,
			reference: fieldDef.reference,
		}
	})
	const viewOnlyMetadata: PlainCollection = {
		name: wirename,
		nameField: "uesio/core.id",
		accessible: true,
		createable: true,
		deleteable: true,
		fields: fieldMetadata,
		namespace: viewOnlyNamespace,
		updateable: true,
	}

	const collectionFullname = `${viewOnlyNamespace}.${wirename}`

	metadata[collectionFullname] = viewOnlyMetadata

	const data: Record<string, PlainWireRecord> = {}
	const original: Record<string, PlainWireRecord> = {}
	const changes: Record<string, PlainWireRecord> = {}

	return {
		view: viewId || "",
		query: !wireDef.init || wireDef.init.query || false,
		conditions: [],
		name: wirename,
		order: [],
		batchid: "",
		batchnumber: 0,
		data,
		original,
		changes,
		deletes: {},
		collection: collectionFullname,
		viewOnly: true,
		fields: wireDef.fields,
		create: !wireDef.init || wireDef.init.create || false,
		defaults: wireDef.defaults,
		events: wireDef.events,
	}
}

export default (
		context: Context,
		wireDefs: Record<string, WireDefinition>
	): ThunkFunc =>
	(dispatch, getState) => {
		const collections: PlainCollectionMap = {}
		const viewId = context.getViewId()
		if (!viewId) throw new Error("Could not get View Def Id")
		const state = getState()

		const viewOnlyDefs: Record<string, WireDefinition> = {}
		const initializedWires = Object.keys(wireDefs).map((wirename) => {
			const wireDef = wireDefs[wirename]
			const existingWire = selectWire(state, viewId, wirename)

			if (existingWire && !wireDef.viewOnly) {
				return {
					...existingWire,
					conditions: wireDef.conditions,
					order: wireDef.order,
					query: !wireDef.init || wireDef.init.query || false,
					create: !wireDef.init || wireDef.init.create || false,
					defaults: wireDef.defaults,
					events: wireDef.events,
					batchsize: wireDef.batchsize,
					requirewriteaccess: wireDef.requirewriteaccess,
					fields: wireDef.fields,
				}
			}
			if (wireDef.viewOnly) {
				viewOnlyDefs[wirename] = wireDef
			}
			return wireDef.viewOnly
				? initializeViewOnlyWire(viewId, wirename, wireDef, collections)
				: initializeRegularWire(viewId, wirename, wireDef)
		})

		dispatch(init([initializedWires, collections]))
		Object.keys(viewOnlyDefs).forEach((wirename) => {
			const wireDef = viewOnlyDefs[wirename]
			if (wireDef.init?.create) {
				dispatch(createrecord(context, wirename))
			}
		})

		return context
	}
