import { create } from "../../src/store/store"
import initializeWiresOp from "../../src/bands/wire/operations/initialize"
import { newContext } from "../../src/context/context"
import { selectWire } from "../../src/bands/wire"
import { getCollection } from "../../src/bands/collection/selectors"
import { PlainCollection } from "../../src/bands/collection/types"

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
	const collectionMetadata: PlainCollection = {
		name: "mycollection",
		namespace: "uesio/tests",
		nameField: "",
		createable: true,
		accessible: true,
		updateable: true,
		deleteable: true,
		fields: {},
		label: "",
		pluralLabel: "",
	}
	const store = create({
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
				"uesio/viewonly.myfield": {
					type: "TEXT",
					label: "My Field",
				},
			},
		},
	})
	const myWire = selectWire(store.getState(), viewId, wireId)
	if (!myWire) throw new Error("Wire not created")

	const myCollection = getCollection(collectionId)
	if (!myCollection) throw new Error("Collection not created")

	expect(myCollection.fields).toEqual({
		"uesio/viewonly.myfield": {
			name: "myfield",
			namespace: "uesio/viewonly",
			type: "TEXT",
			label: "My Field",
			accessible: true,
			createable: true,
			updateable: true,
		},
	})

	expect(myWire.view).toStrictEqual(viewId)
	expect(myWire.name).toStrictEqual(wireId)
})
