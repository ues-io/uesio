import { Context, ViewContext } from "../context/context"
import { DisplayCondition, should, getWiresForConditions } from "./display"

const viewName = "uesio/core.foo"
const viewDef = `
name: ${viewName}}
definition:
    wires: {}
    components: {}
`

const shouldTestCases = [
	{
		type: "invalid condition",
		tests: [
			{
				name: "no condition provided",
				condition: undefined,
				context: new Context(),
				expected: true,
			},
			{
				name: "not an object",
				condition: "",
				context: new Context(),
				expected: true,
			},
		],
	},
	{
		type: "paramIsSet",
		tests: [
			{
				name: "param exists",
				context: new Context().addViewFrame({
					params: { foo: "bar" },
					view: viewName,
					viewDef,
				} as ViewContext),
				condition: { type: "paramIsSet", param: "foo" },
				expected: true,
			},
			{
				name: "param does NOT exist",
				context: new Context().addViewFrame({
					params: {},
					view: viewName,
					viewDef,
				} as ViewContext),
				condition: { type: "paramIsSet", param: "foo" },
				expected: false,
			},
		],
	},
	{
		type: "paramIsNotSet",
		tests: [
			{
				name: "param exists",
				context: new Context().addViewFrame({
					params: { foo: "bar" },
					view: viewName,
					viewDef,
				} as ViewContext),
				condition: { type: "paramIsNotSet", param: "foo" },
				expected: false,
			},
			{
				name: "param does NOT exist",
				context: new Context().addViewFrame({
					params: {},
					view: viewName,
					viewDef,
				} as ViewContext),
				condition: { type: "paramIsNotSet", param: "foo" },
				expected: true,
			},
		],
	},
	{
		type: "fieldMode",
		tests: [
			{
				name: "fieldMode matches",
				context: new Context().addFieldModeFrame("EDIT"),
				condition: { type: "fieldMode", mode: "EDIT" },
				expected: true,
			},
			{
				name: "fieldMode does NOT match",
				context: new Context().addFieldModeFrame("READ"),
				condition: { type: "fieldMode", mode: "EDIT" },
				expected: false,
			},
		],
	},
	{
		type: "group",
		tests: [
			{
				name: "OR - one condition matches",
				context: new Context().addViewFrame({
					params: { foo: "bar", baz: "qux" },
					view: viewName,
					viewDef,
				} as ViewContext),
				condition: {
					type: "group",
					conjunction: "OR",
					conditions: [
						{
							type: "paramIsSet",
							param: "nonexistent",
						} as DisplayCondition,
						{
							type: "paramIsSet",
							param: "baz",
						} as DisplayCondition,
					],
				},
				expected: true,
			},
			{
				name: "OR - both conditions match",
				context: new Context().addViewFrame({
					params: { foo: "bar", baz: "qux" },
					view: viewName,
					viewDef,
				} as ViewContext),
				condition: {
					type: "group",
					conjunction: "OR",
					conditions: [
						{
							type: "paramIsSet",
							param: "foo",
						} as DisplayCondition,
						{
							type: "paramIsSet",
							param: "baz",
						} as DisplayCondition,
					],
				},
				expected: true,
			},
			{
				name: "OR - no conditions match",
				context: new Context().addViewFrame({
					params: {},
					view: viewName,
					viewDef,
				} as ViewContext),
				condition: {
					type: "group",
					conjunction: "OR",
					conditions: [
						{
							type: "paramIsSet",
							param: "foo",
						} as DisplayCondition,
						{
							type: "paramIsSet",
							param: "baz",
						} as DisplayCondition,
					],
				},
				expected: false,
			},
			{
				name: "OR - no conditions given (empty list)",
				context: new Context().addViewFrame({
					params: {},
					view: viewName,
					viewDef,
				} as ViewContext),
				condition: {
					type: "group",
					conjunction: "OR",
					conditions: [],
				},
				expected: true,
			},
			{
				name: "OR - no conditions given (undefined)",
				context: new Context().addViewFrame({
					params: {},
					view: viewName,
					viewDef,
				} as ViewContext),
				condition: {
					type: "group",
					conjunction: "OR",
				},
				expected: true,
			},
			{
				name: "AND - one condition matches",
				context: new Context().addViewFrame({
					params: { foo: "bar", baz: "qux" },
					view: viewName,
					viewDef,
				} as ViewContext),
				condition: {
					type: "group",
					conjunction: "AND",
					conditions: [
						{
							type: "paramIsSet",
							param: "nonexistent",
						} as DisplayCondition,
						{
							type: "paramIsSet",
							param: "baz",
						} as DisplayCondition,
					],
				},
				expected: false,
			},
			{
				name: "AND - all conditions match",
				context: new Context().addViewFrame({
					params: { foo: "bar", baz: "qux" },
					view: viewName,
					viewDef,
				} as ViewContext),
				condition: {
					type: "group",
					conjunction: "AND",
					conditions: [
						{
							type: "paramIsSet",
							param: "foo",
						} as DisplayCondition,
						{
							type: "paramIsSet",
							param: "baz",
						} as DisplayCondition,
					],
				},
				expected: true,
			},
			{
				name: "AND - no conditions match",
				context: new Context().addViewFrame({
					params: {},
					view: viewName,
					viewDef,
				} as ViewContext),
				condition: {
					type: "group",
					conjunction: "AND",
					conditions: [
						{
							type: "paramIsSet",
							param: "foo",
						} as DisplayCondition,
						{
							type: "paramIsSet",
							param: "baz",
						} as DisplayCondition,
					],
				},
				expected: false,
			},
			{
				name: "AND - no conditions given (empty list)",
				context: new Context().addViewFrame({
					params: {},
					view: viewName,
					viewDef,
				} as ViewContext),
				condition: {
					type: "group",
					conjunction: "AND",
					conditions: [],
				},
				expected: true,
			},
			{
				name: "AND - no conditions given (undefined)",
				context: new Context().addViewFrame({
					params: {},
					view: viewName,
					viewDef,
				} as ViewContext),
				condition: {
					type: "group",
					conjunction: "AND",
				},
				expected: true,
			},
		],
	},
]

describe("should", () => {
	shouldTestCases.forEach((def) => {
		describe(def.type, () => {
			def.tests.forEach((tc) => {
				test(tc.name, () => {
					expect(
						should(tc.condition as DisplayCondition, tc.context)
					).toEqual(tc.expected)
				})
			})
		})
	})
})

type GetWireForConditionsTestCase = {
	name: string
	conditions: DisplayCondition[]
	context?: Context
	expected: string[]
}

const contextWithWireFrame = new Context().addWireFrame({
	wire: "piña",
	view: "arroz",
})

const getWiresForConditionsTests = [
	{
		name: "no conditions or context wire",
		conditions: [],
		expected: [],
	},
	{
		name: "no conditions, but there is a context wire",
		conditions: [],
		context: contextWithWireFrame,
		expected: ["piña"],
	},
	{
		name: "condition with wire, and a context wire",
		conditions: [
			{
				type: "wireHasChanges",
				wire: "guanabana",
			},
		],
		context: contextWithWireFrame,
		expected: ["guanabana", "piña"],
	},
	{
		name: "condition with wire, and a context wire that is the same",
		conditions: [
			{
				type: "wireHasChanges",
				wire: "piña",
			},
		],
		context: contextWithWireFrame,
		expected: ["piña"],
	},
	{
		name: "multiple conditions with overlapping wires, and a context wire that is the same",
		conditions: [
			{
				type: "wireHasChanges",
				wire: "piña",
			},
			{
				type: "wireHasNoChanges",
				wire: "guanabana",
			},
			{
				type: "fieldValue",
				wire: "yaca",
				field: "uesio/core.uniquekey",
				operator: "EQUALS",
				value: "something",
			},
		],
		context: contextWithWireFrame,
		expected: ["guanabana", "piña", "yaca"],
	},
	{
		name: "group conditions",
		conditions: [
			{
				type: "group",
				conjunction: "OR",
				conditions: [
					{
						type: "wireHasChanges",
						wire: "banano",
					},
					{
						type: "wireHasChanges",
						wire: "papaya",
					},
					{
						type: "group",
						conjunction: "AND",
						conditions: [
							{
								type: "wireHasChanges",
								wire: "mora",
							},
							{
								type: "wireHasChanges",
								wire: "manzana",
							},
						],
					},
				],
			},
			{
				type: "wireHasNoChanges",
				wire: "guanabana",
			},
			{
				type: "wireHasNoChanges",
				wire: "guayaba",
			},
			{
				type: "group",
				conjunction: "AND",
				conditions: [
					{
						type: "wireHasChanges",
						wire: "cas",
					},
					{
						type: "wireHasChanges",
						wire: "mango",
					},
					{
						type: "paramIsSet",
						param: "frijol",
					},
				],
			},
			{
				type: "fieldValue",
				wire: "mango",
				field: "uesio/core.uniquekey",
				operator: "EQUALS",
				value: "sabrosa",
			},
		],
		context: contextWithWireFrame,
		expected: [
			"banano",
			"cas",
			"guanabana",
			"guayaba",
			"mango",
			"manzana",
			"mora",
			"papaya",
			"piña",
		],
	},
] as GetWireForConditionsTestCase[]

describe("getWiresForConditions", () => {
	getWiresForConditionsTests.forEach((tc) => {
		test(tc.name, () => {
			const actual = getWiresForConditions(
				tc.conditions,
				tc.context || new Context()
			)
			actual.sort()
			tc.expected.sort()
			expect(actual).toEqual(tc.expected)
		})
	})
})
