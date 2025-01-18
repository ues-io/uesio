import { parse } from "../../yaml/yamlutils"
import { yamlMove } from "../defapi"
import { FullPath } from "../path"

const originalViewDefMap = parse(`
components: {}
wires:
    accounts:
        collection: uesio/crm.account
        fields:
            viewOnly:
                viewOnly: true
                label: My View Olnyyyyyy
                type: NUMBER
                number:
                    decimals: 0
            uesio/crm.description: null
            uesio/core.id: null
            uesio/crm.name: null
            uesio/crm.externalid:
            uesio/crm.no_of_employees:
            uesio/core.createdat: null
            uesio/core.updatedat: null
            uesio/crm.contacts:
                fields:
                    uesio/crm.lastname: null
`)

const afterOneMoveViewDefMap = parse(`
components: {}
wires:
    accounts:
        collection: uesio/crm.account
        fields:
            viewOnly:
                viewOnly: true
                label: My View Olnyyyyyy
                type: NUMBER
                number:
                    decimals: 0
            uesio/crm.description: null
            uesio/core.id: null
            uesio/crm.name: null
            uesio/crm.no_of_employees:
            uesio/crm.externalid:
            uesio/core.createdat: null
            uesio/core.updatedat: null
            uesio/crm.contacts:
                fields:
                    uesio/crm.lastname: null
`)

const afterTwoMovesViewDefMap = parse(`
components: {}
wires:
    accounts:
        collection: uesio/crm.account
        fields:
            viewOnly:
                viewOnly: true
                label: My View Olnyyyyyy
                type: NUMBER
                number:
                    decimals: 0
            uesio/crm.description: null
            uesio/core.id: null
            uesio/crm.no_of_employees:
            uesio/crm.name: null
            uesio/crm.externalid:
            uesio/core.createdat: null
            uesio/core.updatedat: null
            uesio/crm.contacts:
                fields:
                    uesio/crm.lastname: null
`)

const originalViewDefArray = parse(`
components:
    - uesio/io.group:
        components:
            - uesio/io.button:
                text: Create
                uesio.variant: uesio/io.secondary
                uesio.id: MyButtonID
            - uesio/io.button:
                text: $Label{uesio/io.cancel}
                uesio.variant: uesio/io.secondary
            - uesio/io.button:
                text: SAVE
                uesio.variant: uesio/io.secondary
                uesio.id: newnew
            - uesio/io.button:
                text: Mode
                uesio.variant: uesio/io.secondary
wires: {}
`)

const afterOneMoveViewDefArray = parse(`
components:
    - uesio/io.group:
        components:
            - uesio/io.button:
                text: Create
                uesio.variant: uesio/io.secondary
                uesio.id: MyButtonID
            - uesio/io.button:
                text: SAVE
                uesio.variant: uesio/io.secondary
                uesio.id: newnew
            - uesio/io.button:
                text: $Label{uesio/io.cancel}
                uesio.variant: uesio/io.secondary
            - uesio/io.button:
                text: Mode
                uesio.variant: uesio/io.secondary
wires: {}
`)

const afterTwoMovesViewDefArray = parse(`
components:
    - uesio/io.group:
        components:
            - uesio/io.button:
                text: SAVE
                uesio.variant: uesio/io.secondary
                uesio.id: newnew
            - uesio/io.button:
                text: Create
                uesio.variant: uesio/io.secondary
                uesio.id: MyButtonID
            - uesio/io.button:
                text: $Label{uesio/io.cancel}
                uesio.variant: uesio/io.secondary
            - uesio/io.button:
                text: Mode
                uesio.variant: uesio/io.secondary
wires: {}
`)

test("YAML MAP move", () => {
  yamlMove(
    originalViewDefMap,
    new FullPath()
      .addLocal("wires")
      .addLocal("accounts")
      .addLocal("fields")
      .addLocal("uesio/crm.no_of_employees"),
    new FullPath()
      .addLocal("wires")
      .addLocal("accounts")
      .addLocal("fields")
      .addLocal("uesio/crm.externalid"),
  )

  expect(originalViewDefMap.toJSON()).toStrictEqual(
    afterOneMoveViewDefMap.toJSON(),
  )

  yamlMove(
    originalViewDefMap,
    new FullPath()
      .addLocal("wires")
      .addLocal("accounts")
      .addLocal("fields")
      .addLocal("uesio/crm.no_of_employees"),
    new FullPath()
      .addLocal("wires")
      .addLocal("accounts")
      .addLocal("fields")
      .addLocal("uesio/crm.name"),
  )

  expect(originalViewDefMap.toJSON()).toStrictEqual(
    afterTwoMovesViewDefMap.toJSON(),
  )
})

test("YAML ARRAY move", () => {
  yamlMove(
    originalViewDefArray,
    new FullPath()
      .addLocal("components")
      .addLocal("0")
      .addLocal("uesio/io.group")
      .addLocal("components")
      .addLocal("2"),
    new FullPath()
      .addLocal("components")
      .addLocal("0")
      .addLocal("uesio/io.group")
      .addLocal("components")
      .addLocal("1"),
  )

  expect(originalViewDefArray.toJSON()).toStrictEqual(
    afterOneMoveViewDefArray.toJSON(),
  )

  yamlMove(
    originalViewDefArray,
    new FullPath()
      .addLocal("components")
      .addLocal("0")
      .addLocal("uesio/io.group")
      .addLocal("components")
      .addLocal("1"),
    new FullPath()
      .addLocal("components")
      .addLocal("0")
      .addLocal("uesio/io.group")
      .addLocal("components")
      .addLocal("0"),
  )

  expect(originalViewDefArray.toJSON()).toStrictEqual(
    afterTwoMovesViewDefArray.toJSON(),
  )
})
