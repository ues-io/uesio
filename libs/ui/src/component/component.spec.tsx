import { Context, ViewContext } from "../context/context"
import { BaseDefinition } from "../definition/definition"
import { resolveDeclarativeComponentDefinition } from "./component"

const viewName = "uesio/core.foo"
const viewDef = `
name: ${viewName}}
definition:
    wires: {}
    components: {}
`
const componentTypeDefinition = [
	{
		"uesio/io.text": {
			text: "$Prop{title}",
		},
	},
	{
		"uesio/io.text": {
			text: "$Prop{subtitle}",
		},
	},
]

const resolveDeclarativeComponentDefinitionTests = [
	{
		name: "no props provided - should merge empty strings",
		context: new Context(),
		inputDefinition: {},
		componentTypeDefinition,
		expected: [
			{
				"uesio/io.text": {
					text: "",
				},
			},
			{
				"uesio/io.text": {
					text: "",
				},
			},
		],
	},
	{
		name: "props provided",
		context: new Context(),
		inputDefinition: {
			title: "foo",
			subtitle: "bar",
		},
		componentTypeDefinition,
		expected: [
			{
				"uesio/io.text": {
					text: "foo",
				},
			},
			{
				"uesio/io.text": {
					text: "bar",
				},
			},
		],
	},
	{
		name: "props provided that include merges",
		context: new Context().addViewFrame({
			params: { foo: "oof", bar: "rab" },
			view: viewName,
			viewDef,
		} as ViewContext),
		inputDefinition: {
			title: "$Param{foo}",
			subtitle: "$Param{bar}",
		},
		componentTypeDefinition,
		expected: [
			{
				"uesio/io.text": {
					text: "oof",
				},
			},
			{
				"uesio/io.text": {
					text: "rab",
				},
			},
		],
	},
]

describe("resolveDeclarativeComponentDefinition", () => {
	resolveDeclarativeComponentDefinitionTests.forEach((tc) => {
		test(tc.name, () => {
			const actual = resolveDeclarativeComponentDefinition(
				tc.context || new Context(),
				tc.inputDefinition as BaseDefinition,
				tc.componentTypeDefinition
			)
			expect(actual).toEqual(tc.expected)
		})
	})
})
