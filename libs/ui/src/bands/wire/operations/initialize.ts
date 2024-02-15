import { dispatch } from "../../../store/store"
import { Context } from "../../../context/context"
import { init } from ".."
import {
	AggregateWireDefinition,
	RegularWireDefinition,
	ViewOnlyField,
	ViewOnlyWireDefinition,
	WireDefinition,
	WireFieldDefinitionMap,
} from "../../../definition/wire"
import { CollectionFieldKey, PlainWire } from "../types"
import { ID_FIELD, PlainCollection } from "../../collection/types"
import { FieldMetadataMap, FieldMetadata } from "../../field/types"
import { LoadRequestField } from "../../../load/loadrequest"
import { hash } from "@twind/core"

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

const getDefinitionHash = (wireDef: WireDefinition) =>
	hash(JSON.stringify(wireDef))

const getBaseWireDefInfo = (wireDef: WireDefinition) => ({
	query: !wireDef.init || wireDef.init.query || false,
	create: wireDef.init ? wireDef.init.create || false : false,
	defaults: wireDef.defaults,
	events: wireDef.events,
	definitionHash: getDefinitionHash(wireDef),
})

const getWireDefInfo = (wireDef: RegularWireDefinition) => ({
	...getBaseWireDefInfo(wireDef),
	fields: getFieldsRequest(wireDef.fields) || [],
	conditions: wireDef.conditions,
	collection: wireDef.collection,
	order: wireDef.order,
	batchsize: wireDef.batchsize,
	requirewriteaccess: wireDef.requirewriteaccess,
	viewOnly: false,
	aggregate: false,
	loadAll: wireDef.loadAll,
})

const getViewOnlyWireDefInfo = (
	wireName: string,
	wireDef: ViewOnlyWireDefinition
) => ({
	...getBaseWireDefInfo(wireDef),
	fields: getFieldsRequest(wireDef.fields) || [],
	collection: "",
	viewOnly: true,
	aggregate: false,
	viewOnlyMetadata: getViewOnlyMetadata(wireName, wireDef),
})

const getAggregateWireDefInfo = (wireDef: AggregateWireDefinition) => ({
	...getBaseWireDefInfo(wireDef),
	fields: [],
	collection: wireDef.collection,
	viewOnly: false,
	aggregate: true,
})

const getViewOnlyFieldMetadata = (
	field: string,
	fieldDef: ViewOnlyField
): FieldMetadata => ({
	...fieldDef,
	accessible: true,
	createable:
		typeof fieldDef.createable === "boolean" ? fieldDef.createable : true,

	updateable:
		typeof fieldDef.updateable === "boolean" ? fieldDef.updateable : true,
	name: field,
	namespace: "",
	label: fieldDef.label || field,
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
	wireDef: RegularWireDefinition
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
		viewOnlyMetadata: {
			fields: getViewOnlyFieldsMetadata(wireDef),
		},
	}) as Partial<PlainWire>

const getViewOnlyMetadata = (
	wireName: string,
	wireDef: ViewOnlyWireDefinition
) => {
	const fieldMetadata: FieldMetadataMap = {
		[ID_FIELD]: {
			accessible: true,
			createable: false,
			name: "id",
			updateable: false,
			namespace: "uesio/core",
			type: "TEXT",
			label: "ID",
		},
	}
	Object.keys(wireDef?.fields || {}).forEach((field) => {
		const fieldDef = wireDef.fields[field]
		fieldMetadata[field] = getViewOnlyFieldMetadata(field, fieldDef)
	})
	return {
		name: wireName,
		nameField: wireDef.nameField || ID_FIELD,
		accessible: true,
		createable: true,
		deleteable: true,
		fields: fieldMetadata,
		namespace: "",
		updateable: true,
		label: wireDef.label || wireName,
		pluralLabel: wireDef.pluralLabel || wireName,
	} as PlainCollection
}

const initExistingWire = (
	existingWire: PlainWire,
	wireDef: WireDefinition
): PlainWire => {
	if (wireDef.viewOnly) {
		return {
			...existingWire,
			...getViewOnlyWireDefInfo(existingWire.name, wireDef),
		}
	}
	if (wireDef.aggregate) {
		return {
			...existingWire,
			...getAggregateWireDefInfo(wireDef),
		}
	}
	return {
		...existingWire,
		changes: {},
		original: { ...existingWire.data },
		deletes: {},
		...getWireDefInfo(wireDef),
		...addViewOnlyFields(wireDef),
	}
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
): PlainWire => {
	if (wireDef.viewOnly) {
		return {
			...getNewPlainWireBase(viewId, wireName),
			...getViewOnlyWireDefInfo(wireName, wireDef),
		}
	}
	if (wireDef.aggregate) {
		return {
			...getNewPlainWireBase(viewId, wireName),
			...getAggregateWireDefInfo(wireDef),
		}
	}
	return {
		...getNewPlainWireBase(viewId, wireName),
		...getWireDefInfo(wireDef),
		...addViewOnlyFields(wireDef),
	}
}

export { initExistingWire, getDefinitionHash }

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

	dispatch(init([initializedWires, undefined, undefined]))

	return context
}
