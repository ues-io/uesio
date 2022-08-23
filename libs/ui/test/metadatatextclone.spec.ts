import { cloneDefinition, cloneKeyDefinition } from "../src/bands/builder"
import { getTestPath, testTextAction } from "./utils/testmetadatatext"

const cloneTests = [
	{
		name: "Clone Component",
		path: `["components"]["0"]`,
		data: `
components:
  - uesio/io.button:
      text: button1
wires:
panels:
`,
		expected: `
components:
  - uesio/io.button:
      text: button1
  - uesio/io.button:
      text: button1
wires:
panels:
`,
	},
]

const cloneKeyTests = [
	{
		name: "Clone Wire",
		path: `["wires"]["mywire"]`,
		data: `
components:
wires:
  mywire:
    collection: mycollection
    fields:
`,
		expected: `
components: null
wires:
  mywire:
    collection: mycollection
    fields: null
  mynewkey:
    collection: mycollection
    fields: null
`,
	},
]

cloneTests.map(({ name, path, data, expected }) =>
	test(name, () => {
		testTextAction(
			data,
			expected,
			cloneDefinition({
				path: getTestPath(path),
			})
		)
	})
)

cloneKeyTests.map(({ name, path, data, expected }) =>
	test(name, () => {
		testTextAction(
			data,
			expected,
			cloneKeyDefinition({
				path: getTestPath(path),
				newKey: "mynewkey",
			})
		)
	})
)
