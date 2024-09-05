import { Context, ViewContext } from "../context/context"
import { DeclarativeComponent } from "../definition/component"
import { BaseDefinition } from "../definition/definition"
import {
	addDefaultPropertyAndSlotValues,
	resolveDeclarativeComponentDefinition,
} from "./component"

const viewName = "uesio/core.foo"
const viewDef = `
name: ${viewName}}
definition:
    wires: {}
    components: {}
`
const componentTypeWithoutSlots = {
	type: "DECLARATIVE",
	namespace: "uesio/tests",
	name: "noslots",
	definition: [
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
	],
}
const componentTypeWithSlots = {
	type: "DECLARATIVE",
	namespace: "uesio/tests",
	name: "hasslots",
	definition: [
		{
			"uesio/io.box": {
				components: [
					{
						"uesio/core.slot": {
							name: "header",
						},
					},
				],
			},
		},
		{
			"uesio/io.text": {
				text: "$Prop{title}",
			},
		},
	],
	slots: [{ name: "header" }],
}

const resolveDeclarativeComponentDefinitionTests = [
	{
		name: "no props provided - should not merge empty strings",
		context: new Context(),
		inputDefinition: {},
		componentDef: componentTypeWithoutSlots,
		expected: [
			{
				"uesio/io.text": {},
			},
			{
				"uesio/io.text": {},
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
		componentDef: componentTypeWithoutSlots,
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
		componentDef: componentTypeWithoutSlots,
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
	{
		name: "props provided that include merges and slots",
		context: new Context().addViewFrame({
			params: { foo: "oof", bar: "rab" },
			view: viewName,
			viewDef,
		} as ViewContext),
		inputDefinition: {
			title: "$Param{foo}",
			header: [
				{
					"uesio/io.text": {
						// This should NOT get merged yet because it's in a slot,
						// and we should strip slots out of the definition when merging Props,
						// since these properties will be merged later as part of rendering the Slot contents.
						text: "$ComponentOutput{uesio/tests.notloadedyet:someproperty}",
					},
				},
			],
		},
		componentDef: componentTypeWithSlots,
		expected: [
			{
				"uesio/io.box": {
					components: [
						{
							"uesio/core.slot": {
								name: "header",
							},
						},
					],
				},
			},
			{
				"uesio/io.text": {
					text: "oof",
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
				tc.componentDef as DeclarativeComponent
			)
			expect(actual).toEqual(tc.expected)
		})
	})
})

const componentTypeWithSlotAndPropertyDefaults = {
	type: "DECLARATIVE",
	namespace: "uesio/tests",
	name: "hasslotandpropertydefaults",
	definition: [
		{
			"uesio/io.box": {
				components: [
					{
						"uesio/core.slot": {
							name: "header",
						},
					},
				],
			},
		},
		{
			"uesio/io.text": {
				text: "$Prop{title}",
			},
		},
	],
	slots: [
		{
			name: "header",
			defaultContent: [
				{
					"uesio/io.titlebar": {
						title: "This is a title: ${uesio/core.uniquekey}",
					},
				},
			],
		},
	],
	properties: [{ name: "title", defaultValue: "Hello $User{email}!" }],
}

const addDefaultPropertyAndSlotValuesTests = [
	{
		name: "component type has no slots",
		inputDefinition: {},
		componentDef: componentTypeWithoutSlots,
		expected: {},
	},
	{
		name: "no defaults defined on the component type for either slots or properties",
		inputDefinition: {
			title: "foo",
		},
		componentDef: componentTypeWithSlots,
		expected: {
			title: "foo",
		},
	},
	{
		name: "no slot/prop values provided, for component type with defaults defined",
		inputDefinition: {},
		componentDef: componentTypeWithSlotAndPropertyDefaults,
		expected: {
			header: [
				{
					"uesio/io.titlebar": {
						title: "This is a title: ${uesio/core.uniquekey}",
					},
				},
			],
			title: "Hello $User{email}!",
		},
	},
	{
		name: "values provided for slots and props, for component type with defaults defined",
		inputDefinition: {
			header: [
				{
					"uesio/io.text": {
						text: "We provided our own header",
					},
				},
			],
			title: "We provided our own title",
		},
		componentDef: componentTypeWithSlotAndPropertyDefaults,
		expected: {
			header: [
				{
					"uesio/io.text": {
						text: "We provided our own header",
					},
				},
			],
			title: "We provided our own title",
		},
	},
]

describe("addDefaultPropertyAndSlotValues", () => {
	addDefaultPropertyAndSlotValuesTests.forEach((tc) => {
		test(tc.name, () => {
			const actual = addDefaultPropertyAndSlotValues(
				tc.inputDefinition as BaseDefinition,
				tc.componentDef as DeclarativeComponent
			)
			expect(actual).toEqual(tc.expected)
		})
	})
})
