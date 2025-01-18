import { getUesioFieldFromSuggestedField } from "./suggestedfields"

const sampleCollectionName = "uesio/tests.inventory"
const samplePluralLabel = "Inventories"
const sampleWorkspaceId = "1234"

const getUesioFieldFromSuggestedFieldTests = [
  {
    name: "parameterized numeric",
    input: {
      type: "numeric(10,2)",
      label: "numeric price",
    },
    expected: {
      "uesio/studio.name": "numeric_price",
      "uesio/studio.type": "NUMBER",
      "uesio/studio.label": "Numeric price",
      "uesio/studio.number": {
        "uesio/studio.decimals": 2,
      },
    },
  },
  {
    name: "int",
    input: {
      type: "int",
      label: "int price",
    },
    expected: {
      "uesio/studio.name": "int_price",
      "uesio/studio.type": "NUMBER",
      "uesio/studio.label": "Int price",
      "uesio/studio.number": {
        "uesio/studio.decimals": 0,
      },
    },
  },
  {
    name: "integer",
    input: {
      type: "integer",
      label: "integer price",
    },
    expected: {
      "uesio/studio.name": "integer_price",
      "uesio/studio.type": "NUMBER",
      "uesio/studio.label": "Integer price",
      "uesio/studio.number": {
        "uesio/studio.decimals": 0,
      },
    },
  },
  {
    name: "date",
    input: {
      type: "date",
      label: "date_of_birth",
    },
    expected: {
      "uesio/studio.name": "date_of_birth",
      "uesio/studio.type": "DATE",
      "uesio/studio.label": "Date of birth",
    },
  },
  {
    name: "boolean",
    input: {
      type: "boolean",
      label: "is safe",
    },
    expected: {
      "uesio/studio.name": "is_safe",
      "uesio/studio.type": "CHECKBOX",
      "uesio/studio.label": "Is safe",
    },
  },
  {
    name: "timestamp",
    input: {
      type: "timestamp",
      label: "Start Time",
    },
    expected: {
      "uesio/studio.name": "start_time",
      "uesio/studio.type": "TIMESTAMP",
      "uesio/studio.label": "Start Time",
    },
  },
  {
    name: "serial",
    input: {
      type: "serial",
      label: "Inventory ID",
    },
    expected: {
      "uesio/studio.name": "inventory_id",
      "uesio/studio.type": "AUTONUMBER",
      "uesio/studio.label": "Inventory ID",
      "uesio/studio.autonumber": {
        "uesio/studio.leadingzeros": 4,
        "uesio/studio.prefix": "IN",
      },
    },
  },
  {
    name: "varchar",
    input: {
      type: "varchar(255)",
      label: "Notes",
    },
    expected: {
      "uesio/studio.name": "notes",
      "uesio/studio.type": "TEXT",
      "uesio/studio.label": "Notes",
    },
  },
  {
    name: "char",
    input: {
      type: "char",
      label: "Initials",
    },
    expected: {
      "uesio/studio.name": "initials",
      "uesio/studio.type": "TEXT",
      "uesio/studio.label": "Initials",
    },
  },
]

describe("AI Suggested Fields", () => {
  getUesioFieldFromSuggestedFieldTests.forEach((def) => {
    test(def.name, () => {
      expect(
        getUesioFieldFromSuggestedField(
          def.input,
          sampleCollectionName,
          samplePluralLabel,
          sampleWorkspaceId,
        ),
      ).toEqual({
        ...def.expected,
        "uesio/studio.collection": sampleCollectionName,
        "uesio/studio.workspace": {
          "uesio/core.id": sampleWorkspaceId,
        },
      })
    })
  })
})
