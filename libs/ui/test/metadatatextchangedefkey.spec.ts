import { changeDefinitionKey } from "../src/bands/builder"
import { getTestPath, testTextAction } from "./utils/testmetadatatext"

const tests = [
	{
		name: "Change Key",
		path: `["components"]["1"]["uesio/io.button"]`,
		key: "uesio/io.box",
		data: `
components:
  - uesio/io.button:
      text: button1
  - uesio/io.button:
      text: button2
`,
		expected: `
components:
  - uesio/io.button:
      text: button1
  - uesio/io.box:
      text: button2
`,
	},
	{
		name: "Change Wire Name",
		path: `["wires"]["myboringwire"]`,
		key: "mycoolwire",
		data: `
wires:
  myboringwire:
    collection: accounts
`,
		expected: `
wires:
  mycoolwire:
    collection: accounts
`,
	},
	{
		name: "Change To Existing",
		path: `["wires"]["foo"]`,
		key: "bar",
		data: `
wires:
  foo:
    collection: accounts
  bar:
    collection: accounts
`,
		expected: `
wires:
  foo:
    collection: accounts
  bar:
    collection: accounts
`,
	},
	{
		name: "Old Equals New",
		path: `["wires"]["foo"]`,
		key: "foo",
		data: `
wires:
  foo:
    collection: accounts
`,
		expected: `
wires:
  foo:
    collection: accounts
`,
	},
]

tests.map(({ name, path, key, data, expected }) =>
	test(name, () => {
		expect(
			testTextAction(
				data,
				changeDefinitionKey({
					path: getTestPath(path),
					key,
				})
			)
		).toStrictEqual(expected.trim())
	})
)
