import { createNextState } from "@reduxjs/toolkit"
import { SetDefinitionPayload } from "../src/bands/builder"
import { MetadataState } from "../src/bands/metadata/types"
import { setDef } from "../src/store/reducers"

type SetTest = {
	payload: SetDefinitionPayload
	data: string
	expected: string
}

const setExistingKey = {
	payload: {
		path: `["components"]["1"]["uesio/io.button"]["text"]`,
		definition: "uesio is awesome",
	},
	data: `components:
  - uesio/io.button:
      text: button1
  - uesio/io.button:
      text: button2

`,
	expected: `components:
  - uesio/io.button:
      text: button1
  - uesio/io.button:
      text: uesio is awesome
`,
}
const setInNulledParent = {
	payload: {
		path: `["components"]["1"]["uesio/io.button"]["text"]`,
		definition: "uesio is awesome",
	},
	data: `components:
  - uesio/io.button:
      text: button1
  - uesio/io.button: null
`,
	expected: `components:
  - uesio/io.button:
      text: button1
  - uesio/io.button:
      text: uesio is awesome
`,
}
const setNonExistentKey = {
	payload: {
		path: `["components"]["1"]["uesio/io.button"]["uesio.variant"]`,
		definition: "uesio/io.primary",
	},
	data: `components:
  - uesio/io.button:
      text: button1
  - uesio/io.button:
      text: button2
`,
	expected: `components:
  - uesio/io.button:
      text: button1
  - uesio/io.button:
      text: button2
      uesio.variant: uesio/io.primary
`,
}

const tests: SetTest[] = [setExistingKey, setInNulledParent, setNonExistentKey]
tests.map(({ data, payload, expected }) =>
	test("viewdef set definition", () => {
		testSet(
			{
				key: "ben/planets.page",
				content: data,
			},
			payload,
			{
				key: "ben/planets.page",
				content: expected,
			}
		)
	})
)

const testSet = (
	initial: MetadataState,
	payload: SetDefinitionPayload,
	expected: MetadataState
) => {
	const newState = createNextState(initial, (draftState) => {
		setDef(draftState, payload)
	})
	expect(newState.content).toStrictEqual(expected.content)
}
