import { createNextState } from "@reduxjs/toolkit"
import { RemoveDefinitionPayload } from "../src/bands/builder"
import { MetadataState } from "../src/bands/metadata/types"
import { removeDef } from "../src/store/reducers"

const buttondeletetest = `
components:
  - uesio/io.button:
      text: button1
  - uesio/io.button:
      text: button2
wires:
panels:
`

const buttondeletetestresult = `
components:
  - uesio/io.button:
      text: button1
wires: null
panels: null
`

test("viewdef delete component", () => {
	testDelete(
		{
			key: "ben/planets.page",
			content: buttondeletetest,
			metadatatype: "viewdef",
		},
		{
			path: `["components"]["1"]`,
		},
		{
			key: "ben/planets.page",
			content: buttondeletetestresult,
			metadatatype: "viewdef",
		}
	)
})

const wiredeletetest = `
components:
wires:
  mywire:
    collection: mycollection
    fields:
  myotherwire:
    collection: myothercollection
    fields:
panels:
`

const wiredeletetestresult = `
components: null
wires:
  myotherwire:
    collection: myothercollection
    fields: null
panels: null
`

test("viewdef delete wire", () => {
	testDelete(
		{
			key: "ben/planets.page",
			content: wiredeletetest,
			metadatatype: "viewdef",
		},
		{
			path: `["wires"]["mywire"]`,
		},
		{
			key: "ben/planets.page",
			content: wiredeletetestresult,
			metadatatype: "viewdef",
		}
	)
})

const testDelete = (
	initial: MetadataState,
	payload: RemoveDefinitionPayload,
	expected: MetadataState
) => {
	const newState = createNextState(initial, (draftState) => {
		removeDef(draftState, payload)
	})
	expect(newState.content.trim()).toStrictEqual(expected.content.trim())
}
