import { addDefinition } from "../src/bands/builder"
import { getTestPath, testTextAction } from "./utils/testmetadatatext"

const tests = [
	{
		name: "Add Before",
		path: `["components"]`,
		index: 0,
		definition: {
			"uesio/io.button": {
				text: "button2",
			},
		},
		data: `
components:
  - uesio/io.button:
      text: button1
`,
		expected: `
components:
  - uesio/io.button:
      text: button2
  - uesio/io.button:
      text: button1
`,
	},
	{
		name: "Add After",
		path: `["components"]`,
		index: 1,
		definition: {
			"uesio/io.button": {
				text: "button2",
			},
		},
		data: `
components:
  - uesio/io.button:
      text: button1
`,
		expected: `
components:
  - uesio/io.button:
      text: button1
  - uesio/io.button:
      text: button2
`,
	},
]

tests.map(({ name, path, definition, index, data, expected }) =>
	test(name, () => {
		testTextAction(
			data,
			expected,
			addDefinition({
				path: getTestPath(path),
				definition,
				index,
			})
		)
	})
)
