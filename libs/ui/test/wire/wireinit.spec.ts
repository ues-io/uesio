import { create } from "../../src/store/store"
import initializeWiresOp from "../../src/bands/wire/operations/initialize"
import loadWiresOp from "../../src/bands/wire/operations/load"
import { newContext } from "../../src/context/context"
import { getCollection } from "../utils/defaults"

// This is a somewhat trivial test to make sure UI only wires are
// initialized correctly. It mostly tests our ability to create a
// new store and dispatch actions against it
test("wire init", () => {
	create({})
	const viewId = "myview"
	const wireId = "mywire"
	const context = newContext().addViewFrame({ view: viewId, viewDef: viewId })
	initializeWiresOp(context, {
		[wireId]: {
			viewOnly: true,
			fields: {},
		},
	})
	const myWire = context.getWire(wireId)
	if (!myWire) throw new Error("Wire not created")

	expect(myWire.getViewId()).toStrictEqual(viewId)
	expect(myWire.getFullId()).toStrictEqual(viewId + ":" + wireId)
})

test("regular wire with view-only field", () => {
	const viewId = "myview"
	const wireId = "mywire"
	const collectionId = "uesio/tests.mycollection"
	const collectionMetadata = getCollection()
	create({
		collection: {
			ids: [collectionId],
			entities: {
				[collectionId]: collectionMetadata,
			},
		},
	})

	const context = newContext().addViewFrame({ view: viewId, viewDef: viewId })
	initializeWiresOp(context, {
		[wireId]: {
			collection: collectionId,
			fields: {
				myfield: {
					type: "TEXT",
					label: "My Field",
					viewOnly: true,
				},
			},
		},
	})
	const myWire = context.getWire(wireId)
	if (!myWire) throw new Error("Wire not created")

	const myCollection = myWire.getCollection()
	if (!myCollection) throw new Error("Collection not created")

	const viewOnlyField = myCollection.getField("myfield")
	if (!viewOnlyField) throw new Error("view only field not created")

	const existingField = myCollection.getField("ben/planets.name")
	if (!existingField) throw new Error("existing field not created")

	expect(viewOnlyField.getName()).toStrictEqual("myfield")
	expect(viewOnlyField.getNamespace()).toStrictEqual("uesio/viewonly")
	expect(viewOnlyField.getLabel()).toStrictEqual("My Field")
	expect(existingField.getName()).toStrictEqual("name")
	expect(existingField.getNamespace()).toStrictEqual("ben/planets")
	expect(existingField.getLabel()).toStrictEqual("Name")
})

test("wire view-only field with default", () => {
	create({})
	const viewId = "myview"
	const wireId = "mywire"
	const context = newContext().addViewFrame({ view: viewId, viewDef: viewId })
	initializeWiresOp(context, {
		[wireId]: {
			viewOnly: true,
			fields: {
				myfield: {
					type: "TEXT",
					label: "My Field",
					viewOnly: true,
				},
			},
			defaults: [
				{
					field: "myfield",
					valueSource: "VALUE",
					value: "My Awesome Value",
				},
			],
			init: {
				create: true,
			},
		},
	})
	loadWiresOp(context, [wireId])
	const myWire = context.getWire(wireId)
	if (!myWire) throw new Error("Wire not created")

	expect(myWire.getViewId()).toStrictEqual(viewId)
	expect(myWire.getFullId()).toStrictEqual(viewId + ":" + wireId)
	expect(myWire.getData().length).toStrictEqual(1)

	const myRecord = myWire.getFirstRecord()
	if (!myRecord) throw new Error("Wire record not created")

	expect(myRecord.getFieldValue("myfield")).toStrictEqual("My Awesome Value")
})
