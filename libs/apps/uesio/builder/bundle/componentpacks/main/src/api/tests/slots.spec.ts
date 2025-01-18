import { FullPath } from "../path"
import { getSelectedSlotPath, getSlotsFromPath } from "../stateapi"

const selectionTests = [
  {
    name: "Simple Slot With Name Only: Selected",
    slotDef: {
      name: "content",
    },
    selectedPath: `["me/my.component"]["content"]`,
    selectedComponentPath: `["me/my.component"]`,
    expected: `["me/my.component"]["content"]`,
  },
  {
    name: "Simple Slot With Name Only: Not Selected",
    slotDef: {
      name: "content",
    },
    selectedPath: `["me/my.component"]["otherprop"]`,
    selectedComponentPath: `["me/my.component"]`,
    expected: undefined,
  },
  {
    name: "Complex Slot With Name and Path: Selected",
    slotDef: {
      name: "content",
      path: "/tabs/~{}",
    },
    selectedPath: `["me/my.component"]["tabs"]["0"]["content"]`,
    selectedComponentPath: `["me/my.component"]`,
    expected: `["me/my.component"]["tabs"]["0"]["content"]`,
  },
  {
    name: "Complex Slot With Name and Path: Not Selected",
    slotDef: {
      name: "content",
      path: "/tabs/~{}",
    },
    selectedPath: `["me/my.component"]["tabs"]["0"]["otherprop"]`,
    selectedComponentPath: `["me/my.component"]`,
    expected: undefined,
  },
]

describe("Slot Selection Tests", () => {
  selectionTests.map((testCase) =>
    test(testCase.name, () => {
      const selectedSlot = getSelectedSlotPath(
        new FullPath("type", "item", testCase.selectedPath),
        new FullPath("type", "item", testCase.selectedComponentPath),
        testCase.slotDef,
      )
      if (!testCase.expected) {
        expect(selectedSlot).toStrictEqual(testCase.expected)
      } else {
        expect(selectedSlot?.localPath).toStrictEqual(testCase.expected)
      }
    }),
  )
})

const getSlotsTests = [
  {
    name: "simple path",
    path: "/content",
    def: {
      content: [{ a: "foo" }, { a: "bar" }],
    },
    expected: [{ a: "foo" }, { a: "bar" }],
  },
  {
    name: "path with wildcard",
    path: "/tabs/~{}",
    def: {
      tabs: [{ a: "foo" }, { a: "bar" }],
    },
    expected: [{ a: "foo" }, { a: "bar" }],
  },
  {
    name: "path with wildcard in middle",
    path: "/tabs/~{}/a",
    def: {
      tabs: [{ a: "foo" }, { a: "bar" }],
    },
    expected: ["foo", "bar"],
  },
  {
    name: "undefined def",
    path: "/tabs/~{}/a",
    def: undefined,
    expected: undefined,
  },
  {
    name: "undefined array",
    path: "/tabs/~{}/a",
    def: {},
    expected: undefined,
  },
]

describe("Get Slots From Path", () => {
  getSlotsTests.map((testCase) =>
    test(testCase.name, () => {
      const slots = getSlotsFromPath(testCase.path, testCase.def)
      expect(slots).toStrictEqual(testCase.expected)
    }),
  )
})
