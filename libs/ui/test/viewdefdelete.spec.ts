import { createNextState } from "@reduxjs/toolkit"
import { RemoveDefinitionPayload } from "../src/bands/builder"
import { MetadataState } from "../src/bands/metadata/types"
import { removeDef } from "../src/store/reducers"

const buttondeletetest = `name: page
namespace: ben/planets
definition:
  components:
    - uesio/io.button:
        text: button1
    - uesio/io.button:
        text: button2
  wires:
  panels:
`

const buttondeletetestresult = `name: page
namespace: ben/planets
definition:
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
		},
		{
			path: `["components"]["1"]`,
		},
		{
			key: "ben/planets.page",
			content: buttondeletetestresult,
		}
	)
})

const wiredeletetest = `name: page
namespace: ben/planets
definition:
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

const wiredeletetestresult = `name: page
namespace: ben/planets
definition:
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
		},
		{
			path: `["wires"]["mywire"]`,
		},
		{
			key: "ben/planets.page",
			content: wiredeletetestresult,
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
	expect(newState.content).toStrictEqual(expected.content)
}
