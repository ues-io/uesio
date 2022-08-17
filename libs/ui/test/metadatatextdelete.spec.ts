import { removeDefinition } from "../src/bands/builder"
import { getTestPath, testTextAction } from "./utils/testmetadatatext"

const tests = [
	{
		name: "Component Delete",
		path: `["components"]["1"]`,
		data: `
components:
  - uesio/io.button:
      text: button1
  - uesio/io.button:
      text: button2
wires:
panels:
`,
		expected: `
components:
  - uesio/io.button:
      text: button1
wires: null
panels: null
`,
	},
	{
		name: "Wire Delete",
		path: `["wires"]["mywire"]`,
		data: `
components:
wires:
  mywire:
    collection: mycollection
    fields:
  myotherwire:
    collection: myothercollection
    fields:
panels:
`,
		expected: `
components: null
wires:
  myotherwire:
    collection: myothercollection
    fields: null
panels: null
`,
	},
]

tests.map(({ name, path, data, expected }) =>
	test(name, () => {
		expect(
			testTextAction(
				data,
				removeDefinition({
					path: getTestPath(path),
				})
			)
		).toStrictEqual(expected.trim())
	})
)
