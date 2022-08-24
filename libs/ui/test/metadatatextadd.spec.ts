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
		name: "Add to the end",
		path: `["components"]`,
		index: -1,
		definition: {
			"uesio/io.button": {
				text: "button3",
			},
		},
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
  - uesio/io.button:
      text: button2
  - uesio/io.button:
      text: button3
`,
	},
	{
		name: "Add to first to last",
		path: `["components"]`,
		index: -2,
		definition: {
			"uesio/io.button": {
				text: "button3",
			},
		},
		data: `
components:
  - uesio/io.button:
      text: button1
  - uesio/io.button:
      text: button2
  - uesio/io.button:
      text: button4
`,
		expected: `
components:
  - uesio/io.button:
      text: button1
  - uesio/io.button:
      text: button2
  - uesio/io.button:
      text: button3
  - uesio/io.button:
      text: button4
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
	{
		name: "Add To Non Existing node",
		path: `["components"]["0"]["uesio/io.box"]["components"]`,
		index: 0,
		definition: {
			"uesio/io.button": {
				text: "button2",
			},
		},
		data: `
components:
  - uesio/io.box: null
`,
		expected: `
components:
  - uesio/io.box:
      components:
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
