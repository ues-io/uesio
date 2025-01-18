import { collection, context, wire, styles, test } from "@uesio/ui"
import { aggregate } from "./aggregate"
import { LabelsDefinition } from "./labels"

const makeFieldMetadata = (
  def: Partial<collection.FieldMetadata>,
): collection.FieldMetadata => ({
  accessible: true,
  createable: true,
  updateable: true,
  type: "TEXT",
  label: "some field",
  name: "",
  namespace: "",
  ...def,
})
const makePlainCollection = (
  def: Partial<collection.PlainCollection>,
): collection.PlainCollection => ({
  createable: true,
  accessible: true,
  updateable: true,
  deleteable: true,
  label: "foo",
  pluralLabel: "foos",
  namespace: "luigi/foo",
  name: "foo",
  fields: {},
  nameField: "uesio/core.id",
  ...def,
})

describe("Chart: aggregate", () => {
  const plainCollection = makePlainCollection({
    name: "registrations",
    namespace: "luigi/foo",
    fields: {
      "uesio/core.id": makeFieldMetadata({
        type: "TEXT",
        name: "id",
        namespace: "uesio/core",
      }),
      "luigi/foo.status": makeFieldMetadata({
        type: "SELECT",
        name: "status",
        namespace: "luigi/foo",
      }),
      "luigi/foo.number": makeFieldMetadata({
        type: "NUMBER",
        name: "number",
        namespace: "luigi/foo",
      }),
    },
  })
  const wireInstance = new wire.Wire({
    changes: {},
    deletes: {},
    original: {},
    view: "",
    name: "registrations",
    collection: "luigi/foo",
    data: {
      "123": {
        "luigi/foo.status": "A",
        "uesio/core.id": "123",
        "luigi/foo.number": 1,
      },
      "323": {
        "luigi/foo.status": "A",
        "uesio/core.id": "323",
        "luigi/foo.number": 2,
      },
      "4423": {
        "luigi/foo.status": "B",
        "uesio/core.id": "4423",
        "luigi/foo.number": 3,
      },
      "48322": {
        "luigi/foo.status": "B",
        "uesio/core.id": "48322",
        "luigi/foo.number": 4,
      },
      "342": {
        "luigi/foo.status": "C",
        "uesio/core.id": "342",
        "luigi/foo.number": 5,
      },
    },
    fields: [{ id: "luigi/foo.status" }, { id: "uesio/core.id" }],
  })
  wireInstance.attachCollection(plainCollection)
  test.create({})
  const contextInstance = new context.Context()
  styles.setupStyles(contextInstance)

  it("should do a count by default on non-numeric value fields", () => {
    const wires = {
      registrations: wireInstance,
    }
    const labelsDefinition = {
      source: "DATA",
    } as LabelsDefinition
    const serieses = [
      {
        wire: "registrations",
        valueField: "uesio/core.id",
        categoryField: "luigi/foo.status",
        label: "Registrations by Status",
        name: "RegistrationsByStatus",
      },
    ]

    const [datasets, categories] = aggregate(
      wires,
      labelsDefinition,
      serieses,
      contextInstance,
    )
    expect(datasets).toEqual([
      {
        label: "Registrations by Status",
        cubicInterpolationMode: "monotone",
        data: [2, 2, 1],
        backgroundColor: "#e11d48",
        borderColor: "#e11d48",
      },
    ])
    expect(categories).toEqual({
      A: "A",
      B: "B",
      C: "C",
    })
  })

  it("should do do a sum by default on numeric value fields", () => {
    const wires = {
      registrations: wireInstance,
    }
    const labelsDefinition = {
      source: "DATA",
    } as LabelsDefinition
    const serieses = [
      {
        wire: "registrations",
        valueField: "luigi/foo.number",
        categoryField: "luigi/foo.status",
        label: "Total Number by Status",
        name: "NumberByStatus",
      },
    ]
    const [datasets, categories] = aggregate(
      wires,
      labelsDefinition,
      serieses,
      contextInstance,
    )
    expect(datasets).toEqual([
      {
        label: "Total Number by Status",
        cubicInterpolationMode: "monotone",
        data: [3, 7, 5],
        backgroundColor: "#e11d48",
        borderColor: "#e11d48",
      },
    ])
    expect(categories).toEqual({
      A: "A",
      B: "B",
      C: "C",
    })
  })
})
