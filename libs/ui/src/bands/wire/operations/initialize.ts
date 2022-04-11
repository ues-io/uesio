import { ThunkFunc } from "../../../store/store"
import { Context, getWireDefFromWireName } from "../../../context/context"
import { init } from ".."
import { getInitializedConditions } from "../conditions/conditions"
import {
	RegularWireDefinition,
	ViewOnlyWireDefinition,
} from "../../../definition/wire"
import { PlainWire } from "../types"
import { PlainCollection, PlainCollectionMap } from "../../collection/types"
import { FieldMetadataMap } from "../../field/types"
import { parseKey } from "../../../component/path"
import { getDefaultRecord } from "../defaults/defaults"
import { PlainWireRecord } from "../../wirerecord/types"
import { nanoid } from "nanoid"

const initializeRegularWire = (
	context: Context,
	viewId: string,
	wirename: string,
	wireDef: RegularWireDefinition
): PlainWire => ({
	view: viewId || "",
	query: !wireDef.init || wireDef.init.query || false,
	name: wirename,
	conditions: getInitializedConditions(wireDef.conditions),
	batchid: "",
	batchnumber: 0,
	data: {},
	original: {},
	changes: {},
	deletes: {},
	collection: wireDef.collection,
})

const initializeViewOnlyWire = (
	context: Context,
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
		const [namespace, name] = parseKey(field)
		if (namespace !== viewOnlyNamespace)
			throw new Error(
				"Invalid namespace for viewOnly field: " + namespace
			)

		fieldMetadata[field] = {
			accessible: true,
			createable: true,
			name,
			updateable: true,
			namespace,
			type: fieldDef.type,
			label: fieldDef.label,
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

	const dataArray: PlainWireRecord[] = []

	const autoCreateRecord = !!wireDef.init?.create

	if (autoCreateRecord) {
		dataArray.push(
			getDefaultRecord(
				context,
				{},
				metadata,
				viewId,
				wireDef,
				collectionFullname
			)
		)
	}
	dataArray.forEach((item) => {
		const localId = nanoid()
		data[localId] = item
		original[localId] = item

		if (autoCreateRecord) {
			changes[localId] = item
		}
	})

	return {
		view: viewId || "",
		query: !wireDef.init || wireDef.init.query || false,
		conditions: [],
		name: wirename,
		batchid: "",
		batchnumber: 0,
		data,
		original,
		changes,
		deletes: {},
		collection: collectionFullname,
		viewOnly: true,
	}
}

export default (context: Context, wireNames: string[]): ThunkFunc =>
	(dispatch) => {
		const collectionMetadata: PlainCollectionMap = {}
		const initializedWires = wireNames.map((wirename: string) => {
			const viewId = context.getViewId()
			if (!viewId) throw new Error("Could not get View Def Id")
			const wireDef = getWireDefFromWireName(viewId, wirename)
			if (!wireDef) throw new Error("Cannot initialize invalid wire")
			return wireDef.viewOnly
				? initializeViewOnlyWire(
						context,
						viewId,
						wirename,
						wireDef,
						collectionMetadata
				  )
				: initializeRegularWire(context, viewId, wirename, wireDef)
		})

		dispatch(init([initializedWires, collectionMetadata]))
		return context
	}
