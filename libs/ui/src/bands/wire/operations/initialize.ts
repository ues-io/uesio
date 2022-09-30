import { RootState, ThunkFunc } from "../../../store/store"
import { Context } from "../../../context/context"
import { init, selectWire } from ".."
import {
	RegularWireDefinition,
	ViewOnlyField,
	ViewOnlyWireDefinition,
	WireDefinition,
	WireFieldDefinitionMap,
} from "../../../definition/wire"
import { PlainWire } from "../types"
import { PlainCollection, PlainCollectionMap } from "../../collection/types"
import { FieldMetadataMap } from "../../field/types"
import { LoadRequestField } from "../../../load/loadrequest"

const getFieldsRequest = (
	fields?: WireFieldDefinitionMap | Record<string, ViewOnlyField>
): LoadRequestField[] | undefined => {
	if (!fields) {
		return undefined
	}
	return Object.keys(fields).map((fieldName) => {
		const fieldData = fields[fieldName]
		const subFields = getFieldsRequest(fieldData?.fields)
		return {
			fields: subFields,
			id: fieldName,
		}
	})
}

const getWireDefInfo = (wireDef: RegularWireDefinition) => ({
	conditions: wireDef.conditions,
	collection: wireDef.collection,
	order: wireDef.order,
	query: !wireDef.init || wireDef.init.query || false,
	create: wireDef.init ? wireDef.init.create || false : false,
	defaults: wireDef.defaults,
	events: wireDef.events,
	batchsize: wireDef.batchsize,
	requirewriteaccess: wireDef.requirewriteaccess,
	fields: getFieldsRequest(wireDef.fields) || [],
})

const initViewOnlyWire = (
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

	return {
		view: viewId || "",
		query: !wireDef.init || wireDef.init.query || false,
		conditions: [],
		name: wirename,
		order: [],
		batchid: "",
		batchnumber: 0,
		data: {},
		original: {},
		changes: {},
		deletes: {},
		collection: collectionFullname,
		viewOnly: true,
		fields: getFieldsRequest(wireDef.fields) || [],
		create: wireDef.init ? wireDef.init.create || false : false,
		defaults: wireDef.defaults,
		events: wireDef.events,
	}
}

const initExistingWire = (
	existingWire: PlainWire,
	wireDef: RegularWireDefinition
) => ({
	...existingWire,
	changes: {},
	original: { ...existingWire.data },
	deletes: {},
	...(wireDef && getWireDefInfo(wireDef)),
})

const initWire = (
	state: RootState,
	viewId: string,
	wirename: string,
	wireDef: WireDefinition,
	existingWire: PlainWire | undefined,
	collections: PlainCollectionMap
) => {
	if (wireDef.viewOnly) {
		return initViewOnlyWire(viewId, wirename, wireDef, collections)
	}

	if (existingWire) {
		return initExistingWire(existingWire, wireDef)
	}

	return {
		view: viewId || "",
		name: wirename,
		batchid: "",
		batchnumber: 0,
		data: {},
		changes: {},
		original: {},
		deletes: {},
		viewOnly: false,
		...getWireDefInfo(wireDef),
	}
}

export { initExistingWire }

export default (
		context: Context,
		wireDefs: Record<string, WireDefinition | undefined>
	): ThunkFunc =>
	(dispatch, getState) => {
		const collections: PlainCollectionMap = {}
		const viewId = context.getViewId()
		const viewDefId = context.getViewDefId()
		if (!viewId) throw new Error("Could not get View Def Id")
		const state = getState()
		const viewDef = state.viewdef.entities[viewDefId || ""]
		const initializedWires = Object.keys(wireDefs).map((wirename) => {
			const wireDef =
				wireDefs[wirename] || viewDef?.definition?.wires?.[wirename]
			if (!wireDef) throw new Error("Could not get wire def")
			const existingWire = selectWire(state, viewId, wirename)
			return initWire(
				state,
				viewId,
				wirename,
				wireDef,
				existingWire,
				collections
			)
		})

		dispatch(init([initializedWires, collections]))

		return context
	}
