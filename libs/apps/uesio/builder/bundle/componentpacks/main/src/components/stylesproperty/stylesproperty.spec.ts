import { context, styles, test as uesioTest } from "@uesio/ui"
import { addTokenToList } from "./stylesproperty"

const testCases = [
  {
    name: "empty list",
    list: [],
    newToken: "p-3",
    expected: ["p-3"],
  },
  {
    name: "unique entries",
    list: ["m-1"],
    newToken: "p-3",
    expected: ["m-1", "p-3"],
  },
  {
    name: "conflicting entries should be deduplicated",
    list: ["m-1", "p-1"],
    newToken: "p-3",
    expected: ["m-1", "p-3"],
  },
  {
    name: "more specific entries should be removed",
    list: ["m-1", "px-4"],
    newToken: "p-3",
    expected: ["m-1", "p-3"],
  },
  {
    name: "custom entries should be deduped",
    list: ["[max-width:1px]", "[max-width:2px]"],
    newToken: "[max-width:1px]",
    expected: ["[max-width:1px]"],
  },
  {
    name: "custom entries with spaces should have spaces removed",
    list: ["[border:1px solid red]", "[max-width:2px]"],
    newToken: "[border:1px_solid_red]",
    expected: ["[max-width:2px]", "[border:1px_solid_red]"],
  },
  {
    name: "complex custom entries should be deduped",
    list: ["[border:1px_solid_red]"],
    newToken: "[border:8px_dashed_white]",
    expected: ["[border:8px_dashed_white]"],
  },
  {
    name: "provided underscores are preserved",
    list: ["before:content-['Hello\\_World']"],
    newToken: "before:content-['Goodbye\\_World']",
    expected: ["before:content-['Goodbye\\_World']"],
  },
  {
    name: "leading/trailing spaces should be trimmed",
    list: ["p-4", " p-5", "p-6 "],
    newToken: " p-7 ",
    expected: ["p-7"],
  },
]

describe("addTokenToList", () => {
  uesioTest.create({})
  const contextInstance = new context.Context()
  styles.setupStyles(contextInstance)
  testCases.forEach((tc) => {
    test(tc.name, () => {
      expect(addTokenToList(tc.newToken, tc.list)).toEqual(tc.expected)
    })
  })
})
