import { createNextState } from "@reduxjs/toolkit"
import { ChangeDefinitionKeyPayload } from "../src/bands/builder"
import { MetadataState } from "../src/bands/metadata/types"
import { changeDefKey } from "../src/store/reducers"

type Test = {
	payload: ChangeDefinitionKeyPayload
	data: string
	expected: string
}

const changeKey = {
	payload: {
		path: `["components"]["1"]["uesio/io.button"]`,
		key: "uesio/io.box",
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
  - uesio/io.box:
      text: button2
`,
}
const changeWireName = {
	payload: {
		path: `["wires"]["myboringwire"]`,
		key: "mycoolwire",
	},
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
}
const tests: Test[] = [changeKey, changeWireName]
tests.map(({ data, payload, expected }) =>
	test("viewdef change definition key", () => {
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
	payload: ChangeDefinitionKeyPayload,
	expected: MetadataState
) => {
	const newState = createNextState(initial, (draftState) => {
		changeDefKey(draftState, payload)
	})
	expect(newState.content.trim()).toStrictEqual(expected.content.trim())
}
