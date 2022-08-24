import { setDefinition } from "../src/bands/builder"
import { getTestPath, testTextAction } from "./utils/testmetadatatext"

const tests = [
	{
		name: "Set Existing Key",
		path: `["components"]["1"]["uesio/io.button"]["text"]`,
		definition: "uesio is awesome",
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
      text: uesio is awesome
`,
	},
	{
		name: "Set In Nulled Parent",
		path: `["components"]["1"]["uesio/io.button"]["text"]`,
		definition: "uesio is awesome",
		data: `
components:
  - uesio/io.button:
      text: button1
  - uesio/io.button: null
`,
		expected: `
components:
  - uesio/io.button:
      text: button1
  - uesio/io.button:
      text: uesio is awesome
`,
	},
	{
		name: "Set Non Existent Key",
		path: `["components"]["1"]["uesio/io.button"]["uesio.variant"]`,
		definition: "uesio/io.primary",
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
      uesio.variant: uesio/io.primary
`,
	},
]

tests.map(({ name, path, definition, data, expected }) =>
	test(name, () => {
		testTextAction(
			data,
			expected,
			setDefinition({
				path: getTestPath(path),
				definition,
			})
		)
	})
)
