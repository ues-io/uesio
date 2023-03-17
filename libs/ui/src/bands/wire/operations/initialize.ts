import { dispatch } from "../../../store/store"
import { Context } from "../../../context/context"
import { init } from ".."
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

const getBaseWireDefInfo = (wireDef: WireDefinition) => ({
	query: !wireDef.init || wireDef.init.query || false,
	create: wireDef.init ? wireDef.init.create || false : false,
	defaults: wireDef.defaults,
	events: wireDef.events,
	fields: getFieldsRequest(wireDef.fields) || [],
})

const getWireDefInfo = (wireDef: RegularWireDefinition) => ({
	...getBaseWireDefInfo(wireDef),
	conditions: wireDef.conditions,
	collection: wireDef.collection,
	order: wireDef.order,
	batchsize: wireDef.batchsize,
	requirewriteaccess: wireDef.requirewriteaccess,
	viewOnly: false,
	loadAll: wireDef.loadAll,
})

const getViewOnlyWireDefInfo = (
	wireDef: ViewOnlyWireDefinition,
	metadata: PlainCollection
) => ({
	...getBaseWireDefInfo(wireDef),
	collection: getMetadataFullName(metadata),
	viewOnly: true,
})

const getViewOnlyMetadata = (
	wirename: string,
	wireDef: ViewOnlyWireDefinition
) => {
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
			selectlist: fieldDef.selectlist,
		}
	})
	return {
		name: wirename,
		nameField: "uesio/core.id",
		accessible: true,
		createable: true,
		deleteable: true,
		fields: fieldMetadata,
		namespace: viewOnlyNamespace,
		updateable: true,
	} as PlainCollection
}

const initExistingWire = (
	existingWire: PlainWire,
	wireDef: WireDefinition,
	collections: PlainCollectionMap
): PlainWire => {
	if (wireDef.viewOnly) {
		const collection = getViewOnlyMetadata(existingWire.name, wireDef)
		collections[getMetadataFullName(collection)] = collection
		return {
			...existingWire,
			...getViewOnlyWireDefInfo(wireDef, collection),
		} as PlainWire
	}
	return {
		...existingWire,
		changes: {},
		original: { ...existingWire.data },
		deletes: {},
		...getWireDefInfo(wireDef),
	} as PlainWire
}

const getNewPlainWireBase = (viewId: string, wirename: string) =>
	({
		view: viewId || "",
		name: wirename,
		batchid: "",
		batchnumber: 0,
		data: {},
		changes: {},
		original: {},
		deletes: {},
	} as PlainWire)

const getMetadataFullName = (metadata: PlainCollection) =>
	`${metadata.namespace}.${metadata.name}`

const initWire = (
	viewId: string,
	wirename: string,
	wireDef: WireDefinition,
	collections: PlainCollectionMap
): PlainWire => {
	if (wireDef.viewOnly) {
		const collection = getViewOnlyMetadata(wirename, wireDef)
		collections[getMetadataFullName(collection)] = collection
		return {
			...getNewPlainWireBase(viewId, wirename),
			...getViewOnlyWireDefInfo(wireDef, collection),
		} as PlainWire
	}

	return {
		...getNewPlainWireBase(viewId, wirename),
		...getWireDefInfo(wireDef),
	} as PlainWire
}

export { initExistingWire }

export default (
	context: Context,
	wireDefs: Record<string, WireDefinition | undefined>
) => {
	const collections: PlainCollectionMap = {}
	const viewId = context.getViewId()

	if (!viewId) throw new Error("Could not get View Def Id")
	const initializedWires = Object.keys(wireDefs).map((wirename) => {
		const wireDef =
			wireDefs[wirename] || context.getViewDef()?.wires?.[wirename]
		if (!wireDef) throw new Error("Could not get wire def")
		return initWire(viewId, wirename, wireDef, collections)
	})

	dispatch(init([initializedWires, collections]))

	return context
}
