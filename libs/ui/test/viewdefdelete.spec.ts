import { createNextState } from "@reduxjs/toolkit"
import { RemoveDefinitionPayload } from "../src/bands/builder"
import { PlainViewDef } from "../src/bands/viewdef/types"
import { removeDef } from "../src/store/reducers"

test("viewdef delete component", () => {
	testDelete(
		{
			name: "name",
			namespace: "namespace",
			definition: {
				components: [
					{
						"io.button": {
							text: "button1",
						},
					},
					{
						"io.button": {
							text: "button2",
						},
					},
				],
				wires: {},
				panels: {},
			},
		},
		{
			path: `["components"]["1"]`,
		},
		{
			name: "name",
			namespace: "namespace",
			definition: {
				components: [
					{
						"io.button": {
							text: "button1",
						},
					},
				],
				wires: {},
				panels: {},
			},
		}
	)
})

test("viewdef delete wire", () => {
	testDelete(
		{
			name: "name",
			namespace: "namespace",
			definition: {
				components: [],
				wires: {
					mywire: {
						collection: "mycollection",
						fields: {},
					},
					myotherwire: {
						collection: "myothercollection",
						fields: {},
					},
				},
				panels: {},
			},
		},
		{
			path: `["wires"]["mywire"]`,
		},
		{
			name: "name",
			namespace: "namespace",
			definition: {
				components: [],
				wires: {
					myotherwire: {
						collection: "myothercollection",
						fields: {},
					},
				},
				panels: {},
			},
		}
	)
})

const testDelete = (
	initial: PlainViewDef,
	payload: RemoveDefinitionPayload,
	expected: PlainViewDef
) => {
	const newState = createNextState(initial, (draftState) => {
		removeDef(draftState, payload)
	})
	expect(newState).toStrictEqual(expected)
	// We have to stringify here to match key order
	expect(JSON.stringify(newState)).toBe(JSON.stringify(expected))
}
