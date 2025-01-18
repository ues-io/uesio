import { create } from "../../src/store/store"
import initializeWiresOp from "../../src/bands/wire/operations/initialize"
import loadWiresOp from "../../src/bands/wire/operations/load"
import { newContext } from "../../src/context/context"
import { getCollectionSlice } from "../utils/defaults"
import { createRecordOp } from "../../src/bands/wire/operations/createrecord"
import { Dependencies, RouteState } from "../../src/bands/route/types"

const viewId = "myview"
const wireId = "mywire"
const collectionId = "ben/planets.exoplanet"
const sampleUUID = "some-nice-uuid"

const getRoute = (dependencies?: Dependencies): RouteState => ({
  view: viewId,
  namespace: "ben/planets",
  path: "",
  theme: "",
  title: "",
  tags: [],
  dependencies,
})

// This is a somewhat trivial test to make sure UI only wires are
// initialized correctly. It mostly tests our ability to create a
// new store and dispatch actions against it
test("wire init", () => {
  create({})
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
  expect(myWire.getFields().length).toStrictEqual(0)
})

test("regular wire with view-only field and collection field", () => {
  const viewId = "myview"
  const wireId = "mywire"

  create({
    route: getRoute({
      collection: getCollectionSlice(),
    }),
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
        "ben/planets.name": {},
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
  expect(viewOnlyField.getNamespace()).toStrictEqual("")
  expect(viewOnlyField.getLabel()).toStrictEqual("My Field")
  expect(existingField.getName()).toStrictEqual("name")
  expect(existingField.getNamespace()).toStrictEqual("ben/planets")
  expect(existingField.getLabel()).toStrictEqual("Name")
  expect(myWire.getFields().length).toStrictEqual(2)
})

test("wire view-only field with default", () => {
  create({})

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
  expect(myWire.getFields().length).toStrictEqual(1)

  const myRecord = myWire.getFirstRecord()
  if (!myRecord) throw new Error("Wire record not created")

  expect(myRecord.getFieldValue("myfield")).toStrictEqual("My Awesome Value")
})

test("wire with default reference field and struct field", () => {
  create({
    route: getRoute({
      collection: getCollectionSlice(),
    }),
  })

  const context = newContext().addViewFrame({ view: viewId, viewDef: viewId })
  initializeWiresOp(context, {
    [wireId]: {
      collection: collectionId,
      fields: {
        galaxy: {},
      },
      defaults: [
        {
          field: "galaxy",
          valueSource: "VALUE",
          value: sampleUUID,
        },
        {
          field: "location->x",
          valueSource: "VALUE",
          value: "30 parsecs",
        },
      ],
    },
  })
  createRecordOp({ context, wireName: wireId })
  const myWire = context.getWire(wireId)
  if (!myWire) throw new Error("Wire not created")

  expect(myWire.getViewId()).toStrictEqual(viewId)
  expect(myWire.getFullId()).toStrictEqual(viewId + ":" + wireId)
  expect(myWire.getData().length).toStrictEqual(1)
  expect(myWire.getFields().length).toStrictEqual(1)

  const myCollection = myWire.getCollection()
  if (!myCollection) throw new Error("Collection not created")

  // Get metadata across a reference field with localized names
  const galaxyNameField = myCollection.getField("galaxy->name")
  if (!galaxyNameField)
    throw new Error("couldn't get reference traversal field")
  expect(galaxyNameField.getName()).toStrictEqual("name")
  expect(galaxyNameField.getNamespace()).toStrictEqual("ben/planets")
  expect(galaxyNameField.getLabel()).toStrictEqual("Name")

  // Get metadata across a reference field with partially localized names
  const galaxyNameField2 = myCollection.getField("galaxy->ben/planets.name")
  if (!galaxyNameField2)
    throw new Error("couldn't get reference traversal field")
  expect(galaxyNameField2.getName()).toStrictEqual("name")
  expect(galaxyNameField2.getNamespace()).toStrictEqual("ben/planets")
  expect(galaxyNameField2.getLabel()).toStrictEqual("Name")

  // Get metadata across a struct field with localized names
  const structFieldX = myCollection.getField("location->x")
  if (!structFieldX) throw new Error("couldn't get struct traversal field")
  expect(structFieldX.getName()).toStrictEqual("x")
  expect(structFieldX.getNamespace()).toStrictEqual("")
  expect(structFieldX.getLabel()).toStrictEqual("X")

  const myRecord = myWire.getFirstRecord()
  if (!myRecord) throw new Error("Wire record not created")

  expect(myRecord.getFieldValue("galaxy")).toStrictEqual({
    "uesio/core.id": sampleUUID,
  })
  expect(myRecord.getFieldValue("ben/planets.galaxy")).toStrictEqual({
    "uesio/core.id": sampleUUID,
  })

  expect(myRecord.getFieldValue("galaxy->uesio/core.id")).toStrictEqual(
    sampleUUID,
  )
  expect(
    myRecord.getFieldValue("ben/planets.galaxy->uesio/core.id"),
  ).toStrictEqual(sampleUUID)

  expect(myRecord.getFieldValue("location->x")).toStrictEqual("30 parsecs")
  expect(myRecord.getFieldValue("ben/planets.location->x")).toStrictEqual(
    "30 parsecs",
  )
})
