import { createNextState } from "@reduxjs/toolkit"
import { PlainViewDef } from "../src/bands/viewdef/types"
import { MoveDefinitionPayload } from "../src/bands/builder"
import { moveDef } from "../src/store/reducers"

test("viewdef move component", () => {
	testMove(
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
			toPath: `["components"]["0"]`,
			fromPath: `["components"]["1"]`,
		},
		{
			name: "name",
			namespace: "namespace",
			definition: {
				components: [
					{
						"io.button": {
							text: "button2",
						},
					},
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

test("viewdef move wire", () => {
	testMove(
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
			toPath: `["wires"]["mywire"]`,
			fromPath: `["wires"]["myotherwire"]`,
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
					mywire: {
						collection: "mycollection",
						fields: {},
					},
				},
				panels: {},
			},
		}
	)
})

test("viewdef move component different parent", () => {
	testMove(
		{
			name: "name",
			namespace: "namespace",
			definition: {
				components: [
					{
						"io.group": {
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
						},
					},
					{
						"io.group": {
							components: [
								{
									"io.button": {
										text: "button3",
									},
								},
								{
									"io.button": {
										text: "button4",
									},
								},
							],
						},
					},
				],
				wires: {},
				panels: {},
			},
		},
		{
			toPath: `["components"]["1"]["io.group"]["components"]["0"]`,
			fromPath: `["components"]["0"]["io.group"]["components"]["0"]`,
			selectKey: "io.button",
		},
		{
			name: "name",
			namespace: "namespace",
			definition: {
				components: [
					{
						"io.group": {
							components: [
								{
									"io.button": {
										text: "button2",
									},
								},
							],
						},
					},
					{
						"io.group": {
							components: [
								{
									"io.button": {
										text: "button1",
									},
								},
								{
									"io.button": {
										text: "button3",
									},
								},
								{
									"io.button": {
										text: "button4",
									},
								},
							],
						},
					},
				],
				wires: {},
				panels: {},
			},
		}
	)
})

const testMove = (
	initial: PlainViewDef,
	payload: MoveDefinitionPayload,
	expected: PlainViewDef
) => {
	const newState = createNextState(initial, (draftState) => {
		moveDef(draftState, payload)
	})
	expect(newState).toStrictEqual(expected)
	// We have to stringify here to match key order
	expect(JSON.stringify(newState)).toBe(JSON.stringify(expected))
}
