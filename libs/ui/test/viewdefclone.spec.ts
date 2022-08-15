import { createNextState } from "@reduxjs/toolkit"
import { CloneDefinitionPayload } from "../src/bands/builder"
import { MetadataState } from "../src/bands/metadata/types"
import { cloneDef } from "../src/store/reducers"

const buttonclonetest = `
components:
  - uesio/io.button:
      text: button1
wires:
panels:
`

const buttonclonetestresult = `
components:
  - uesio/io.button:
      text: button1
  - uesio/io.button:
      text: button1
wires: null
panels: null
`

test("viewdef clone component", () => {
	testClone(
		{
			key: "ben/planets.page",
			content: buttonclonetest,
			metadatatype: "viewdef",
		},
		{
			path: `["components"]["0"]`,
		},
		{
			key: "ben/planets.page",
			content: buttonclonetestresult,
			metadatatype: "viewdef",
		}
	)
})

const wireclonetest = `
components:
wires:
  mywire:
    collection: mycollection
    fields:
`

const wireclonetestresult = `
components: null
wires:
  mywire:
    collection: mycollection
    fields: null
  mywire61:
    collection: mycollection
    fields: null
`

test("viewdef clone wire", () => {
	testClone(
		{
			key: "ben/planets.page",
			content: wireclonetest,
			metadatatype: "viewdef",
		},
		{
			path: `["wires"]["mywire"]`,
		},
		{
			key: "ben/planets.page",
			content: wireclonetestresult,
			metadatatype: "viewdef",
		}
	)
})

beforeEach(() => {
	jest.spyOn(Math, "random").mockReturnValue(1)
})
afterEach(() => {
	jest.spyOn(Math, "random").mockRestore()
})

const testClone = (
	initial: MetadataState,
	payload: CloneDefinitionPayload,
	expected: MetadataState
) => {
	const newState = createNextState(initial, (draftState) => {
		cloneDef(draftState, payload)
	})
	expect(newState.content.trim()).toStrictEqual(expected.content.trim())
}
