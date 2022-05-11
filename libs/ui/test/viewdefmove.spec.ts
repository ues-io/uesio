import { createNextState } from "@reduxjs/toolkit"
import { MoveDefinitionPayload } from "../src/bands/builder"
import { moveDef } from "../src/store/reducers"
import { MetadataState } from "../src/bands/metadata/types"

const moveComponentTest = `name: page
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

const moveComponentTestResult = `name: page
namespace: ben/planets
definition:
  components:
    - uesio/io.button:
        text: button2
    - uesio/io.button:
        text: button1
  wires: null
  panels: null
`

test("viewdef move component", () => {
	testMove(
		{
			key: "ben/planets.page",
			content: moveComponentTest,
		},
		{
			toPath: `["components"]["0"]`,
			fromPath: `["components"]["1"]`,
		},
		{
			key: "ben/planets.page",
			content: moveComponentTestResult,
		}
	)
})

const moveWireTest = `name: page
namespace: ben/planets
definition:
  wires:
    myotherwire:
      collection: myothercollection
      fields:
    mywire:
      collection: mycollection
      fields:
  panels: null
`

const moveWireTestResult = `name: page
namespace: ben/planets
definition:
  wires:
    mywire:
      collection: mycollection
      fields: null
    myotherwire:
      collection: myothercollection
      fields: null
  panels: null
`

test("viewdef move wire", () => {
	testMove(
		{
			key: "ben/planets.page",
			content: moveWireTest,
		},
		{
			toPath: `["wires"]["mywire"]`,
			fromPath: `["wires"]["myotherwire"]`,
		},
		{
			key: "ben/planets.page",
			content: moveWireTestResult,
		}
	)
})

const moveComponentDifferentParentTest = `name: page
namespace: ben/planets
definition:
  components:
    - uesio/io.group:
        components:
          - uesio/io.button:
              text: button1
          - uesio/io.button:
              text: button2
    - uesio/io.group:
        components:
          - uesio/io.button:
              text: button3
          - uesio/io.button:
              text: button4
  wires: null
  panels: null
`

const moveComponentDifferentParentTestResult = `name: page
namespace: ben/planets
definition:
  components:
    - uesio/io.group:
        components:
          - uesio/io.button:
              text: button2
    - uesio/io.group:
        components:
          - uesio/io.button:
              text: button1
          - uesio/io.button:
              text: button3
          - uesio/io.button:
              text: button4
  wires: null
  panels: null
`

test("viewdef move component different parent", () => {
	testMove(
		{
			key: "ben/planets.page",
			content: moveComponentDifferentParentTest,
		},
		{
			toPath: `["components"]["1"]["uesio/io.group"]["components"]["0"]`,
			fromPath: `["components"]["0"]["uesio/io.group"]["components"]["0"]`,
			selectKey: "uesio/io.button",
		},
		{
			key: "ben/planets.page",
			content: moveComponentDifferentParentTestResult,
		}
	)
})

const testMove = (
	initial: MetadataState,
	payload: MoveDefinitionPayload,
	expected: MetadataState
) => {
	const newState = createNextState(initial, (draftState) => {
		moveDef(draftState, payload)
	})
	expect(newState.content).toStrictEqual(expected.content)
}
