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
import { CollectionFieldKey, PlainWire } from "../types"
import { PlainCollection } from "../../collection/types"
import { FieldMetadataMap, FieldMetadata } from "../../field/types"
import { LoadRequestField } from "../../../load/loadrequest"

const getFieldsRequest = (
	fields?: WireFieldDefinitionMap | Record<CollectionFieldKey, ViewOnlyField>
): LoadRequestField[] | undefined => {
	if (!fields) {
		return undefined
	}
	return Object.keys(fields).map((fieldName: CollectionFieldKey) => {
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
	wireName: string,
	wireDef: ViewOnlyWireDefinition
) => ({
	...getBaseWireDefInfo(wireDef),
	collection: `${viewOnlyNamespace}.${wireName}`,
	viewOnly: true,
	viewOnlyMetadata: getViewOnlyMetadata(wireName, wireDef),
})

const viewOnlyNamespace = "uesio/viewonly"

const getViewOnlyFieldMetadata = (
	field: string,
	fieldDef: ViewOnlyField
): FieldMetadata => ({
	accessible: true,
	createable: true,
	name: field,
	updateable: true,
	namespace: viewOnlyNamespace,
	type: fieldDef.type,
	subtype: fieldDef.subtype,
	label: fieldDef.label || field,
	reference: fieldDef.reference,
	selectlist: fieldDef.selectlist,
	number: fieldDef.number,
	subfields: fieldDef.fields
		? Object.fromEntries(
				Object.entries(fieldDef.fields).map(
					([subfieldId, subfieldDef]) => [
						subfieldId,
						getViewOnlyFieldMetadata(subfieldId, subfieldDef),
					]
				)
		  )
		: undefined,
})

const getViewOnlyFieldsMetadata = (
	wireDef: WireDefinition
): FieldMetadataMap => {
	const fieldMetadata: FieldMetadataMap = {}
	const fields = wireDef.fields
	if (!fields) return fieldMetadata
	Object.keys(fields).forEach((field) => {
		const fieldDef = fields[field] as ViewOnlyField
		if (fieldDef?.viewOnly) {
			fieldMetadata[field] = getViewOnlyFieldMetadata(field, fieldDef)
		}
	})
	return fieldMetadata
}

const addViewOnlyFields = (wireDef: RegularWireDefinition) =>
	({
		fields: getViewOnlyFieldsMetadata(wireDef),
	} as PlainCollection)

const getViewOnlyMetadata = (
	wireName: string,
	wireDef: ViewOnlyWireDefinition
) => {
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
		fieldMetadata[field] = getViewOnlyFieldMetadata(field, fieldDef)
	})
	return {
		name: wireName,
		nameField: "uesio/core.id",
		accessible: true,
		createable: true,
		deleteable: true,
		fields: fieldMetadata,
		namespace: viewOnlyNamespace,
		updateable: true,
		label: wireDef.label || wireName,
		pluralLabel: wireDef.pluralLabel || wireName,
	} as PlainCollection
}

const initExistingWire = (
	existingWire: PlainWire,
	wireDef: WireDefinition
): PlainWire =>
	wireDef.viewOnly
		? {
				...existingWire,
				...getViewOnlyWireDefInfo(existingWire.name, wireDef),
		  }
		: {
				...existingWire,
				changes: {},
				original: { ...existingWire.data },
				deletes: {},
				...getWireDefInfo(wireDef),
				viewOnlyMetadata: addViewOnlyFields(wireDef),
		  }

const getNewPlainWireBase = (viewId: string, wireName: string) => ({
	view: viewId || "",
	name: wireName,
	batchid: "",
	batchnumber: 0,
	data: {},
	changes: {},
	original: {},
	deletes: {},
})

const initWire = (
	viewId: string,
	wireName: string,
	wireDef: WireDefinition
): PlainWire =>
	wireDef.viewOnly
		? {
				...getNewPlainWireBase(viewId, wireName),
				...getViewOnlyWireDefInfo(wireName, wireDef),
		  }
		: {
				...getNewPlainWireBase(viewId, wireName),
				...getWireDefInfo(wireDef),
				viewOnlyMetadata: addViewOnlyFields(wireDef),
		  }

export { initExistingWire }

export default (
	context: Context,
	wireDefs: Record<string, WireDefinition | undefined>
) => {
	const viewId = context.getViewId()

	if (!viewId) throw new Error("Could not get View Def Id")
	const initializedWires = Object.keys(wireDefs).map((wireName) => {
		const wireDef =
			wireDefs[wireName] || context.getViewDef()?.wires?.[wireName]
		if (!wireDef) throw new Error("Could not get wire def")
		return initWire(viewId, wireName, wireDef)
	})

	dispatch(init([initializedWires, undefined]))

	return context
}
