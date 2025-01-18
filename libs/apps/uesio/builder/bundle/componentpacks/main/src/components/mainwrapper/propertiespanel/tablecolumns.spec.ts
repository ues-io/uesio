import { FullPath } from "../../../api/path"
import { ColumnDefinition, isSelected } from "./tablecolumns"

const defaultColumns = [
  {
    field: "foo/bar.alpha",
  },
  {
    field: "foo/bar.beta",
  },
  {
    field: "uesio/core.createdby->uesio/core.username",
  },
  {
    field: "uesio/core.createdby->uesio/core.createdby->uesio/core.firstname",
  },
  {
    field: "uesio/core.createdby->uesio/core.owner->uesio/core.initials",
  },
  {
    field: "",
    components: [],
  },
] as ColumnDefinition[]

type isSelectedTestCase = {
  name: string
  columns?: ColumnDefinition[]
  fieldId: string
  path: FullPath
  expect: boolean
}

const testCases = [
  {
    name: "no columns",
    columns: null,
    fieldId: "foo/bar.alpha",
    path: new FullPath(),
    expect: false,
  },
  {
    name: "empty columns",
    columns: [],
    fieldId: "foo/bar.alpha",
    path: new FullPath(),
    expect: false,
  },
  {
    name: "just Components columns",
    columns: [
      {
        components: [],
      },
    ],
    fieldId: "foo/bar.alpha",
    path: new FullPath(),
    expect: false,
  },
  {
    name: "direct match",
    fieldId: "foo/bar.alpha",
    path: new FullPath(),
    expect: true,
  },
  {
    name: "match on reference field prefix",
    fieldId: "uesio/core.createdby",
    path: new FullPath(),
    expect: true,
  },
  {
    name: "no matching field",
    fieldId: "uesio/core.owner",
    path: new FullPath(),
    expect: false,
  },
  {
    name: "reference traversal - match",
    fieldId: "uesio/core.username",
    path: new FullPath().addLocal("uesio/core.createdby").addLocal("fields"),
    expect: true,
  },
  {
    name: "reference traversal - no match",
    fieldId: "uesio/core.lastname",
    path: new FullPath().addLocal("uesio/core.createdby").addLocal("fields"),
    expect: false,
  },
  {
    name: "deep reference traversal - recursive - match",
    fieldId: "uesio/core.firstname",
    path: new FullPath()
      .addLocal("uesio/core.createdby")
      .addLocal("fields")
      .addLocal("uesio/core.createdby")
      .addLocal("fields"),
    expect: true,
  },
  {
    name: "deep reference traversal - recursive - no match",
    fieldId: "uesio/core.id",
    path: new FullPath()
      .addLocal("uesio/core.createdby")
      .addLocal("fields")
      .addLocal("uesio/core.createdby")
      .addLocal("fields"),
    expect: false,
  },
  {
    name: "deep reference traversal - non-recursive - match",
    fieldId: "uesio/core.initials",
    path: new FullPath()
      .addLocal("uesio/core.createdby")
      .addLocal("fields")
      .addLocal("uesio/core.owner")
      .addLocal("fields"),
    expect: true,
  },
  {
    name: "deep reference traversal - should not match on same recursive prefix",
    fieldId: "uesio/core.createdby",
    path: new FullPath()
      .addLocal("uesio/core.createdby")
      .addLocal("fields")
      .addLocal("uesio/core.createdby")
      .addLocal("fields"),
    expect: false,
  },
] as isSelectedTestCase[]

describe("Table Columns Component - fieldPicker isSelected", () => {
  testCases.forEach((tc) => {
    test(tc.name, () => {
      expect(
        isSelected(
          tc.columns !== undefined ? tc.columns : defaultColumns,
          tc.path,
          tc.fieldId,
        ),
      ).toEqual(tc.expect)
    })
  })
})
