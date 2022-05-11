import { createNextState } from "@reduxjs/toolkit"
import { CloneDefinitionPayload } from "../src/bands/builder"
import { MetadataState } from "../src/bands/metadata/types"
import { cloneDef } from "../src/store/reducers"

const buttonclonetest = `name: page
namespace: ben/planets
definition:
  components:
    - uesio/io.button:
        text: button1
  wires:
  panels:
`

const buttonclonetestresult = `name: page
namespace: ben/planets
definition:
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
		},
		{
			path: `["components"]["0"]["uesio/io.button"]`,
		},
		{
			key: "ben/planets.page",
			content: buttonclonetestresult,
		}
	)
})

/*
// Had to comment this out because we're generating random wire names on clone
// That's pretty hard to test.
const wireclonetest = `name: page
namespace: ben/planets
definition:
  components:
  wires:
    mywire:
      collection: mycollection
      fields:
  panels:
`

const wireclonetestresult = `name: page
namespace: ben/planets
definition:
  components: null
  wires:
    mywire:
      collection: mycollection
      fields: null
    mywire:
      collection: mycollection
      fields: null
  panels: null
`

test("viewdef clone wire", () => {
	testClone(
		{
			key: "ben/planets.page",
			content: wireclonetest,
		},
		{
			path: `["wires"]["mywire"]`,
		},
		{
			key: "ben/planets.page",
			content: wireclonetestresult,
		}
	)
})
*/

const testClone = (
	initial: MetadataState,
	payload: CloneDefinitionPayload,
	expected: MetadataState
) => {
	const newState = createNextState(initial, (draftState) => {
		cloneDef(draftState, payload)
	})
	expect(newState.content).toStrictEqual(expected.content)
}
