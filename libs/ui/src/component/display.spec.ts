import { Context, ViewContext } from "../context/context"
import { PlainWireRecord } from "../wireexports"
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
		type: "fieldValue",
		tests: [
			// STRING
			{
				name: "{foo: bar}, (field: foo, value: bar)",
				context: new Context().addRecordDataFrame({
					foo: "bar",
				} as PlainWireRecord),
				condition: { type: "fieldValue", field: "foo", value: "bar" },
				expected: true,
			},
			{
				name: "{foo: oof}, (field: foo, value: bar)",
				context: new Context().addRecordDataFrame({
					foo: "oof",
				} as PlainWireRecord),
				condition: { type: "fieldValue", field: "foo", value: "bar" },
				expected: false,
			},
			{
				name: "{foo: oof}, (field: foo, value: bar, operator: NOT_EQUALS)",
				context: new Context().addRecordDataFrame({
					foo: "oof",
				} as PlainWireRecord),
				condition: {
					type: "fieldValue",
					field: "foo",
					value: "bar",
					operator: "NOT_EQUALS",
				},
				expected: true,
			},
			{
				name: "{foo: bar}, (field: foo, value: oof, operator: NOT_EQUALS)",
				context: new Context().addRecordDataFrame({
					foo: "bar",
				} as PlainWireRecord),
				condition: {
					type: "fieldValue",
					field: "foo",
					value: "oof",
					operator: "NOT_EQUALS",
				},
				expected: true,
			},
			{
				name: "{foo: bar}, (field: foo, values: [bar,baz], operator: IN)",
				context: new Context().addRecordDataFrame({
					foo: "bar",
				} as PlainWireRecord),
				condition: {
					type: "fieldValue",
					field: "foo",
					operator: "IN",
					values: ["bar", "baz"],
				},
				expected: true,
			},
			{
				name: "{foo: oof}, (field: foo, values: [bar,baz], operator: IN)",
				context: new Context().addRecordDataFrame({
					foo: "oof",
				} as PlainWireRecord),
				condition: {
					type: "fieldValue",
					field: "foo",
					operator: "IN",
					values: ["bar", "baz"],
				},
				expected: false,
			},
			{
				name: "{foo: oof}, (field: foo, values: [bar,baz], operator: NOT_IN)",
				context: new Context().addRecordDataFrame({
					foo: "oof",
				} as PlainWireRecord),
				condition: {
					type: "fieldValue",
					field: "foo",
					operator: "NOT_IN",
					values: ["bar", "baz"],
				},
				expected: true,
			},
			{
				name: "{}, (field: foo, values: [bar,baz], operator: NOT_IN)",
				context: new Context().addRecordDataFrame(
					{} as PlainWireRecord
				),
				condition: {
					type: "fieldValue",
					field: "foo",
					operator: "NOT_IN",
					values: ["bar", "baz"],
				},
				expected: true,
			},
			{
				name: "{foo: }, (field: foo, values: [bar], operator: NOT_IN)",
				context: new Context().addRecordDataFrame({
					foo: "",
				} as PlainWireRecord),
				condition: {
					type: "fieldValue",
					field: "foo",
					operator: "NOT_IN",
					values: ["bar"],
				},
				expected: true,
			},
			{
				name: "{foo: }, (field: foo, values: [bar,baz], operator: NOT_IN)",
				context: new Context().addRecordDataFrame({
					foo: "",
				} as PlainWireRecord),
				condition: {
					type: "fieldValue",
					field: "foo",
					operator: "NOT_IN",
					values: ["bar", "baz"],
				},
				expected: true,
			},
			{
				name: "{foo: bar}, (field: foo, values: [bar,baz], operator: NOT_IN)",
				context: new Context().addRecordDataFrame({
					foo: "bar",
				} as PlainWireRecord),
				condition: {
					type: "fieldValue",
					field: "foo",
					operator: "NOT_IN",
					values: ["bar", "baz"],
				},
				expected: false,
			},
			// BOOLEAN
			{
				name: "{awake: true}, (field: awake, value: true)",
				context: new Context().addRecordDataFrame({
					awake: true,
				} as PlainWireRecord),
				condition: { type: "fieldValue", field: "awake", value: true },
				expected: true,
			},
			{
				name: "{awake: false}, (field: awake, value: true)",
				context: new Context().addRecordDataFrame({
					awake: false,
				} as PlainWireRecord),
				condition: { type: "fieldValue", field: "awake", value: true },
				expected: false,
			},
			{
				name: "{awake: false}, (field: awake, value: false)",
				context: new Context().addRecordDataFrame({
					awake: false,
				} as PlainWireRecord),
				condition: { type: "fieldValue", field: "awake", value: false },
				expected: true,
			},
			{
				name: "{awake: true}, (field: awake, value: false)",
				context: new Context().addRecordDataFrame({
					awake: true,
				} as PlainWireRecord),
				condition: { type: "fieldValue", field: "awake", value: false },
				expected: false,
			},
			{
				name: "{awake: true}, (field: awake, value: true, operator: NOT_EQUALS)",
				context: new Context().addRecordDataFrame({
					awake: true,
				} as PlainWireRecord),
				condition: {
					type: "fieldValue",
					field: "awake",
					value: true,
					operator: "NOT_EQUALS",
				},
				expected: false,
			},
			{
				name: "{awake: false}, (field: awake, value: true, operator: NOT_EQUALS)",
				context: new Context().addRecordDataFrame({
					awake: false,
				} as PlainWireRecord),
				condition: {
					type: "fieldValue",
					field: "awake",
					value: true,
					operator: "NOT_EQUALS",
				},
				expected: true,
			},
			{
				name: "{awake: false}, (field: awake, value: false, operator: NOT_EQUALS)",
				context: new Context().addRecordDataFrame({
					awake: false,
				} as PlainWireRecord),
				condition: {
					type: "fieldValue",
					field: "awake",
					value: false,
					operator: "NOT_EQUALS",
				},
				expected: false,
			},
			{
				name: "{awake: true}, (field: awake, value: false, operator: NOT_EQUALS)",
				context: new Context().addRecordDataFrame({
					awake: true,
				} as PlainWireRecord),
				condition: {
					type: "fieldValue",
					field: "awake",
					value: false,
					operator: "NOT_EQUALS",
				},
				expected: true,
			},
			// NUMBER
			{
				name: "{age: 1}, (field: age, value: 1)",
				context: new Context().addRecordDataFrame({
					age: 1,
				} as PlainWireRecord),
				condition: { type: "fieldValue", field: "age", value: 1 },
				expected: true,
			},
			{
				name: "{age: 1}, (field: age, value: 0)",
				context: new Context().addRecordDataFrame({
					age: 1,
				} as PlainWireRecord),
				condition: { type: "fieldValue", field: "age", value: 0 },
				expected: false,
			},
			{
				name: "{age: 0}, (field: age, value: 1)",
				context: new Context().addRecordDataFrame({
					age: 0,
				} as PlainWireRecord),
				condition: { type: "fieldValue", field: "age", value: 1 },
				expected: false,
			},
			{
				name: "{age: 0}, (field: age, value: 0)",
				context: new Context().addRecordDataFrame({
					age: 0,
				} as PlainWireRecord),
				condition: { type: "fieldValue", field: "age", value: 0 },
				expected: true,
			},
			{
				name: "{age: 1}, (field: age, value: 0, operator: NOT_EQUALS)",
				context: new Context().addRecordDataFrame({
					age: 1,
				} as PlainWireRecord),
				condition: {
					type: "fieldValue",
					field: "age",
					value: 0,
					operator: "NOT_EQUALS",
				},
				expected: true,
			},
			{
				name: "{age: 1}, (field: age, value: 1, operator: NOT_EQUALS)",
				context: new Context().addRecordDataFrame({
					age: 1,
				} as PlainWireRecord),
				condition: {
					type: "fieldValue",
					field: "age",
					value: 1,
					operator: "NOT_EQUALS",
				},
				expected: false,
			},
			{
				name: "{age: 0}, (field: age, value: 1, operator: NOT_EQUALS)",
				context: new Context().addRecordDataFrame({
					age: 0,
				} as PlainWireRecord),
				condition: {
					type: "fieldValue",
					field: "age",
					value: 1,
					operator: "NOT_EQUALS",
				},
				expected: true,
			},
			{
				name: "{age: 0}, (field: age, value: 0, operator: NOT_EQUALS)",
				context: new Context().addRecordDataFrame({
					age: 0,
				} as PlainWireRecord),
				condition: {
					type: "fieldValue",
					field: "age",
					value: 0,
					operator: "NOT_EQUALS",
				},
				expected: false,
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
		type: "hasValue",
		tests: [
			{
				name: "value is present",
				context: new Context()
					.addViewFrame({
						view: viewName,
						viewDef,
					} as ViewContext)
					.addSignalOutputFrame("step1", {
						foo: "bar",
					}),
				condition: {
					type: "hasValue",
					value: "$SignalOutput{step1:foo}",
				},
				expected: true,
			},
			{
				name: "value is present but empty - should NOT be considered to be there",
				context: new Context()
					.addViewFrame({
						view: viewName,
						viewDef,
					} as ViewContext)
					.addSignalOutputFrame("step1", {
						foo: "",
					}),
				condition: {
					type: "hasValue",
					value: "$SignalOutput{step1:foo}",
				},
				expected: false,
			},
			{
				name: "value is not present",
				context: new Context()
					.addViewFrame({
						view: viewName,
						viewDef,
					} as ViewContext)
					.addSignalOutputFrame("step1", {}),
				condition: {
					type: "hasValue",
					value: "$SignalOutput{step1:foo}",
				},
				expected: false,
			},
		],
	},
	{
		type: "hasNoValue",
		tests: [
			{
				name: "value is present",
				context: new Context()
					.addViewFrame({
						view: viewName,
						viewDef,
					} as ViewContext)
					.addSignalOutputFrame("step1", {
						foo: "bar",
					}),
				condition: {
					type: "hasNoValue",
					value: "$SignalOutput{step1:foo}",
				},
				expected: false,
			},
			{
				name: "value is present but empty - should NOT be considered to be there",
				context: new Context()
					.addViewFrame({
						view: viewName,
						viewDef,
					} as ViewContext)
					.addSignalOutputFrame("step1", {
						foo: "",
					}),
				condition: {
					type: "hasNoValue",
					value: "$SignalOutput{step1:foo}",
				},
				expected: true,
			},
			{
				name: "value is not present",
				context: new Context()
					.addViewFrame({
						view: viewName,
						viewDef,
					} as ViewContext)
					.addSignalOutputFrame("step1", {}),
				condition: {
					type: "hasNoValue",
					value: "$SignalOutput{step1:foo}",
				},
				expected: true,
			},
		],
	},
	{
		type: "mergeValue",
		tests: [
			{
				name: "values match - strings - EQUALS operator",
				context: new Context()
					.addViewFrame({
						view: viewName,
						viewDef,
					} as ViewContext)
					.addSignalOutputFrame("step1", {
						alice: "apples",
						bob: "apples",
					}),
				condition: {
					type: "mergeValue",
					sourceValue: "$SignalOutput{step1:alice}",
					value: "$SignalOutput{step1:bob}",
					operator: "EQUALS",
				},
				expected: true,
			},
			{
				name: "values match - strings - no operator specified",
				context: new Context()
					.addViewFrame({
						view: viewName,
						viewDef,
					} as ViewContext)
					.addSignalOutputFrame("step1", {
						alice: "apples",
						bob: "apples",
					}),
				condition: {
					type: "mergeValue",
					sourceValue: "$SignalOutput{step1:alice}",
					value: "$SignalOutput{step1:bob}",
				},
				expected: true,
			},
			{
				name: "values match - strings - NOT_EQUALS operator",
				context: new Context()
					.addViewFrame({
						view: viewName,
						viewDef,
					} as ViewContext)
					.addSignalOutputFrame("step1", {
						alice: "apples",
						bob: "apples",
					}),
				condition: {
					type: "mergeValue",
					sourceValue: "$SignalOutput{step1:alice}",
					value: "$SignalOutput{step1:bob}",
					operator: "NOT_EQUALS",
				},
				expected: false,
			},
			{
				name: "values do not match - strings",
				context: new Context()
					.addViewFrame({
						view: viewName,
						viewDef,
					} as ViewContext)
					.addSignalOutputFrame("step1", {
						alice: "peaches",
						bob: "apples",
					}),
				condition: {
					type: "mergeValue",
					sourceValue: "$SignalOutput{step1:alice}",
					value: "$SignalOutput{step1:bob}",
				},
				expected: false,
			},
			{
				name: "values match - numbers",
				context: new Context()
					.addViewFrame({
						view: viewName,
						viewDef,
					} as ViewContext)
					.addSignalOutputFrame("step1", {
						alice: 2,
						bob: 2,
					}),
				condition: {
					type: "mergeValue",
					sourceValue: "$SignalOutput{step1:alice}",
					value: "$SignalOutput{step1:bob}",
					operator: "EQUALS",
				},
				expected: true,
			},
			{
				name: "values do not match - numbers",
				context: new Context()
					.addViewFrame({
						view: viewName,
						viewDef,
					} as ViewContext)
					.addSignalOutputFrame("step1", {
						alice: 2,
						bob: 1,
					}),
				condition: {
					type: "mergeValue",
					sourceValue: "$SignalOutput{step1:alice}",
					value: "$SignalOutput{step1:bob}",
					operator: "EQUALS",
				},
				expected: false,
			},
			{
				name: "values match - booleans",
				context: new Context()
					.addViewFrame({
						view: viewName,
						viewDef,
					} as ViewContext)
					.addSignalOutputFrame("step1", {
						alice: true,
						bob: true,
					}),
				condition: {
					type: "mergeValue",
					sourceValue: "$SignalOutput{step1:alice}",
					value: "$SignalOutput{step1:bob}",
					operator: "EQUALS",
				},
				expected: true,
			},
			{
				name: "values do not match - booleans",
				context: new Context()
					.addViewFrame({
						view: viewName,
						viewDef,
					} as ViewContext)
					.addSignalOutputFrame("step1", {
						alice: false,
						bob: true,
					}),
				condition: {
					type: "mergeValue",
					sourceValue: "$SignalOutput{step1:alice}",
					value: "$SignalOutput{step1:bob}",
					operator: "EQUALS",
				},
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
