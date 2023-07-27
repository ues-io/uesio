import { Context, ViewContext } from "../context/context"
import { DisplayCondition, should } from "./display"

const viewName = "uesio/core.foo"
const viewDef = `
name: ${viewName}}
definition:
    wires: {}
    components: {}
`

const shouldTestCases = [
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
