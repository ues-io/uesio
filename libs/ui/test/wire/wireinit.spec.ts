import { create } from "../../src/store/store"
import initializeWiresOp from "../../src/bands/wire/operations/initialize"
import { newContext } from "../../src/context/context"
import { selectWire } from "../../src/bands/wire"
import { getCollection } from "../utils/defaults"

// This is a somewhat trivial test to make sure UI only wires are
// initialized correctly. It mostly tests our ability to create a
// new store and dispatch actions against it
test("wire init", () => {
	const store = create({})
	const viewId = "myview"
	const wireId = "mywire"
	const context = newContext().addViewFrame({ view: viewId, viewDef: viewId })
	initializeWiresOp(context, {
		[wireId]: {
			viewOnly: true,
			fields: {},
		},
	})
	const myWire = selectWire(store.getState(), viewId, wireId)
	if (!myWire) throw new Error("Wire not created")

	expect(myWire.view).toStrictEqual(viewId)
	expect(myWire.name).toStrictEqual(wireId)
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
