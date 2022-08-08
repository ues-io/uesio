import { ThunkFunc } from "../../../store/store"
import { Context } from "../../../context/context"
import { init } from ".."
import { getInitializedConditions } from "../conditions/conditions"
import {
	RegularWireDefinition,
	ViewOnlyWireDefinition,
	WireDefinition,
} from "../../../definition/wire"
import { PlainWire } from "../types"
import { PlainCollection, PlainCollectionMap } from "../../collection/types"
import { FieldMetadataMap } from "../../field/types"
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
	def: wireDef,
	data: {},
	original: {},
	order: wireDef.order || [],
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
		def: wireDef,
		order: [],
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

export default (
		context: Context,
		wireDefs: Record<string, WireDefinition>
	): ThunkFunc =>
	(dispatch) => {
		const collectionMetadata: PlainCollectionMap = {}
		const viewId = context.getViewId()
		if (!viewId) throw new Error("Could not get View Def Id")
		const initializedWires = Object.keys(wireDefs).map((wirename) => {
			const wireDef = wireDefs[wirename]
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
