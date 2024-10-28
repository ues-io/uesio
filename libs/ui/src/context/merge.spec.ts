import { Context } from "./context"
import {
	InvalidComponentOutputMsg,
	InvalidSignalOutputMergeMsg,
	MergeOptions,
} from "./merge"

type MergeWithContextTestCase = {
	name: string
	context: Context
	expected: string | undefined
	input: string
	expectError: string | undefined
	options?: MergeOptions
}

type MergeBooleanTestCase = {
	name: string
	defaultValue: boolean
	context: Context
	expected: boolean
	input: string | boolean
}

const signalOutputContextHappyPath = new Context().addSignalOutputFrame(
	"myStep",
	{
		foo: "bar",
		two: 2,
		zero: 0,
		true: true,
		false: false,
	}
)

const signalOutputContextString = new Context().addSignalOutputFrame(
	"myStep",
	"myString"
)

const signalOutputMergeTestCases = [
	{
		name: "happy path - colon delimiter",
		context: signalOutputContextHappyPath,
		input: "$SignalOutput{myStep:foo}",
		expected: "bar",
	},
	{
		name: "happy path - colon delimiter - single",
		context: signalOutputContextString,
		input: "$SignalOutput{myStep}",
		expected: "myString",
	},
	{
		name: "happy path - bracket delimiter - single",
		context: signalOutputContextString,
		input: "$SignalOutput{[myStep]}",
		expected: "myString",
	},
	{
		name: "happy path - bracket delimiter - empty - single",
		context: signalOutputContextString,
		input: "$SignalOutput{[myStep][]}",
		expected: "myString",
	},
	{
		name: "happy path - bracket delimiter",
		context: signalOutputContextHappyPath,
		input: "$SignalOutput{[myStep][foo]}",
		expected: "bar",
	},
	{
		name: "sad path - bad syntax",
		context: signalOutputContextHappyPath,
		input: "$SignalOutput{[someOtherStep[foo]}",
		expectError: InvalidSignalOutputMergeMsg,
	},
	{
		name: "sad path - signal outputs not found for step",
		context: signalOutputContextHappyPath,
		input: "$SignalOutput{[someOtherStep][foo]}",
		expectError: `Could not find signal output for step: someOtherStep`,
	},
	{
		name: "happy path - boolean true",
		context: signalOutputContextHappyPath,
		input: "$SignalOutput{myStep:true}",
		expected: true,
	},
	{
		name: "happy path - boolean false",
		context: signalOutputContextHappyPath,
		input: "$SignalOutput{myStep:false}",
		expected: false,
	},
	{
		name: "happy path - number",
		context: signalOutputContextHappyPath,
		input: "$SignalOutput{myStep:two}",
		expected: 2,
	},
	{
		name: "happy path - falsey number",
		context: signalOutputContextHappyPath,
		input: "$SignalOutput{myStep:zero}",
		expected: 0,
	},
] as MergeWithContextTestCase[]

const componentOutputContextHappyPath = new Context().addComponentFrame(
	"uesio/io.barchart",
	{
		foo: "bar",
	}
)

const componentOutputMergeTestCases = [
	{
		name: "happy path - colon delimiter",
		context: componentOutputContextHappyPath,
		input: "$ComponentOutput{uesio/io.barchart:foo}",
		expected: "bar",
	},
	{
		name: "happy path - bracket delimiter",
		context: componentOutputContextHappyPath,
		input: "$ComponentOutput{[uesio/io.barchart][foo]}",
		expected: "bar",
	},
	{
		name: "sad path - bad syntax",
		context: componentOutputContextHappyPath,
		input: "$ComponentOutput{[nothing[foo]}",
		expectError: InvalidComponentOutputMsg,
	},
	{
		name: "sad path - component outputs not found",
		context: componentOutputContextHappyPath,
		input: "$ComponentOutput{[someComponent][foo]}",
		expectError: `Could not find component output data for component: someComponent`,
	},
] as MergeWithContextTestCase[]

const mergeStringTestCases = [
	{
		name: "happy path - value is a string",
		context: new Context().addRecordDataFrame({
			foo: "bar",
		}),
		input: "${foo}",
		expected: "bar",
	},
	{
		name: "value is undefined",
		context: new Context().addRecordDataFrame({}),
		input: "${foo}",
		expected: "",
	},
	{
		name: "value is null",
		context: new Context().addRecordDataFrame({
			foo: null,
		}),
		input: "${foo}",
		expected: "",
	},
	{
		name: "value is empty string",
		context: new Context().addRecordDataFrame({
			foo: "",
		}),
		input: "${foo}",
		expected: "",
	},
	{
		name: "value is boolean true",
		context: new Context().addRecordDataFrame({
			foo: true,
		}),
		input: "${foo}",
		expected: "true",
	},
	{
		name: "value is boolean false",
		context: new Context().addRecordDataFrame({
			foo: false,
		}),
		input: "${foo}",
		expected: "false",
	},
	{
		name: "value is number zero",
		context: new Context().addRecordDataFrame({
			foo: 0,
		}),
		input: "${foo}",
		expected: "0",
	},
	{
		name: "value is float zero",
		context: new Context().addRecordDataFrame({
			foo: 0.0,
		}),
		input: "${foo}",
		expected: "0",
	},
	{
		name: "value is number 1",
		context: new Context().addRecordDataFrame({
			foo: 1,
		}),
		input: "${foo}",
		expected: "1",
	},
	{
		name: "value is object, merge is a nested piece of it",
		context: new Context().addRecordDataFrame({
			foo: {
				bar: "baz",
			},
		}),
		input: "${foo->bar}",
		expected: "baz",
	},
	{
		name: "value is object, merge is the object itself",
		context: new Context().addRecordDataFrame({
			foo: {
				bar: "baz",
			},
		}),
		input: "${foo}",
		expected: JSON.stringify({
			bar: "baz",
		}),
	},
	{
		name: "value is array, merge is the array itself",
		context: new Context().addRecordDataFrame({
			foo: ["bar", "baz"],
		}),
		input: "${foo}",
		expected: JSON.stringify(["bar", "baz"]),
	},
] as MergeWithContextTestCase[]

const mergeBooleanTestCases = [
	{
		name: "happy path - merge result is a Boolean true",
		context: new Context().addRecordDataFrame({
			foo: true,
		}),
		input: "${foo}",
		defaultValue: false,
		expected: true,
	},
	{
		name: "happy path - merge result is a Boolean false",
		context: new Context().addRecordDataFrame({
			bar: false,
		}),
		input: "${bar}",
		defaultValue: true,
		expected: false,
	},
	{
		name: "happy path - value is a boolean true, not a merge",
		context: new Context(),
		input: true,
		defaultValue: false,
		expected: true,
	},
	{
		name: "happy path - value is a boolean false, not a merge",
		context: new Context(),
		input: false,
		defaultValue: true,
		expected: false,
	},
	{
		name: "value is undefined - use default true",
		context: new Context().addRecordDataFrame({}),
		input: "${foo}",
		defaultValue: true,
		expected: true,
	},
	{
		name: "value is undefined - use default false",
		context: new Context().addRecordDataFrame({}),
		input: "${foo}",
		defaultValue: false,
		expected: false,
	},
	{
		name: "result is not a boolean - use default",
		context: new Context().addRecordDataFrame({
			foo: "bar",
		}),
		input: "${foo}",
		defaultValue: true,
		expected: true,
	},
	{
		name: "value is null - use default",
		context: new Context().addRecordDataFrame({
			foo: null,
		}),
		input: "${foo}",
		defaultValue: false,
		expected: false,
	},
	{
		name: "value is empty string - use default",
		context: new Context().addRecordDataFrame({
			foo: "",
		}),
		input: "${foo}",
		defaultValue: true,
		expected: true,
	},
] as MergeBooleanTestCase[]

const mergeTestCases = [
	{
		name: "value is a string",
		context: new Context().addRecordDataFrame({
			foo: "bar",
		}),
		input: "${foo}",
		expected: "bar",
	},
	{
		name: "value is undefined",
		context: new Context().addRecordDataFrame({}),
		input: "${foo}",
		expected: "",
	},
	{
		name: "value is null",
		context: new Context().addRecordDataFrame({
			foo: null,
		}),
		input: "${foo}",
		expected: "",
	},
	{
		name: "value is empty string",
		context: new Context().addRecordDataFrame({
			foo: "",
		}),
		input: "${foo}",
		expected: "",
	},
	{
		name: "value is boolean true",
		context: new Context().addRecordDataFrame({
			foo: true,
		}),
		input: "${foo}",
		expected: true,
	},
	{
		name: "value is boolean false",
		context: new Context().addRecordDataFrame({
			foo: false,
		}),
		input: "${foo}",
		expected: false,
	},
	{
		name: "value is number zero",
		context: new Context().addRecordDataFrame({
			foo: 0,
		}),
		input: "${foo}",
		expected: 0,
	},
	{
		name: "value is float zero",
		context: new Context().addRecordDataFrame({
			foo: 0.0,
		}),
		input: "${foo}",
		expected: 0.0,
	},
	{
		name: "value is number 1",
		context: new Context().addRecordDataFrame({
			foo: 1,
		}),
		input: "${foo}",
		expected: 1,
	},
	{
		name: "value is number 1 but the template starts with string contents",
		context: new Context().addRecordDataFrame({
			foo: 1,
		}),
		input: "Some Text ${foo}",
		expected: "Some Text 1",
	},
	{
		name: "value is number 1 but the template ends with string contents",
		context: new Context().addRecordDataFrame({
			foo: 1,
		}),
		input: "${foo} Some Text",
		expected: "1 Some Text",
	},
	{
		name: "value is object, merge is a nested piece of it",
		context: new Context().addRecordDataFrame({
			foo: {
				bar: "baz",
			},
		}),
		input: "${foo->bar}",
		expected: "baz",
	},
	{
		name: "value is object, merge is the object itself",
		context: new Context().addRecordDataFrame({
			foo: {
				bar: "baz",
			},
		}),
		input: "${foo}",
		expected: {
			bar: "baz",
		},
	},
	{
		name: "value is array, merge is the array itself",
		context: new Context().addRecordDataFrame({
			foo: ["bar", "baz"],
		}),
		input: "${foo}",
		expected: ["bar", "baz"],
	},
	{
		name: "multiple values requested in the merge, values are numbers",
		context: new Context().addRecordDataFrame({
			foo: 0,
			bar: 1,
		}),
		input: "${foo} + ${bar} = 1",
		expected: "0 + 1 = 1",
	},
	{
		name: "multiple values requested in the merge, values are booleans",
		context: new Context().addRecordDataFrame({
			foo: true,
			bar: false,
		}),
		input: "${foo} || ${bar} => ${foo}",
		expected: "true || false => true",
	},
] as MergeWithContextTestCase[]

const mergeOptionsTestCases = [
	{
		name: "only merge specific types",
		context: new Context().addSignalOutputFrame("step1", {
			foo: "bar",
		}),
		input: "$Collection{$SignalOutput{step1:foo}:pluralLabel}",
		expected: "$Collection{bar:pluralLabel}",
		options: {
			types: ["SignalOutput"],
		} as MergeOptions,
	},
	{
		name: "only merge specific types",
		context: new Context().addPropsFrame(
			{
				foo: "bar",
				baz: "qux",
			},
			"",
			"me/myapp.mycomponent"
		),
		input: "$Collection{$Prop{foo}:pluralLabel} $Prop{baz}",
		expected: "$Collection{bar:pluralLabel} qux",
		options: {
			types: ["Prop"],
		} as MergeOptions,
	},
] as MergeWithContextTestCase[]

const mergeTextTestCases = [
	{
		name: "simple text merge",
		context: new Context(),
		input: "$Text{blah}",
		expected: "blah",
	},
	{
		name: "simple text merge",
		context: new Context(),
		input: "$Text{$SignalOutput{[ask][data]}}",
		expected: "$SignalOutput{[ask][data]}",
	},
] as MergeWithContextTestCase[]

describe("merge", () => {
	describe("$SignalOutput context", () => {
		signalOutputMergeTestCases.forEach((tc) => {
			test(tc.name, () => {
				let errCaught
				let actual
				try {
					actual = tc.context.merge(tc.input)
				} catch (e) {
					errCaught = e
				}
				expect(errCaught).toEqual(tc.expectError)
				expect(actual).toEqual(tc.expected)
			})
		})
	})
	describe("$ComponentOutput context", () => {
		componentOutputMergeTestCases.forEach((tc) => {
			test(tc.name, () => {
				let errCaught
				let actual
				try {
					actual = tc.context.merge(tc.input)
				} catch (e) {
					errCaught = e
				}
				expect(errCaught).toEqual(tc.expectError)
				expect(actual).toEqual(tc.expected)
			})
		})
	})
	describe("mergeString", () => {
		mergeStringTestCases.forEach((tc) => {
			test(tc.name, () => {
				let errCaught
				let actual
				try {
					actual = tc.context.mergeString(tc.input)
				} catch (e) {
					errCaught = (e as Error).message
				}
				expect(errCaught).toEqual(tc.expectError)
				expect(actual).toEqual(tc.expected)
			})
		})
	})
	describe("merge", () => {
		mergeTestCases.forEach((tc) => {
			test(tc.name, () => {
				let errCaught
				let actual
				try {
					actual = tc.context.merge(tc.input)
				} catch (e) {
					errCaught = (e as Error).message
				}
				expect(errCaught).toEqual(tc.expectError)
				expect(actual).toEqual(tc.expected)
			})
		})
	})
	describe("merge", () => {
		mergeTextTestCases.forEach((tc) => {
			test(tc.name, () => {
				let errCaught
				let actual
				try {
					actual = tc.context.merge(tc.input)
				} catch (e) {
					errCaught = (e as Error).message
				}
				expect(errCaught).toEqual(tc.expectError)
				expect(actual).toEqual(tc.expected)
			})
		})
	})
	describe("mergeBoolean", () => {
		mergeBooleanTestCases.forEach((tc) => {
			test(tc.name, () => {
				expect(
					tc.context.mergeBoolean(tc.input, tc.defaultValue)
				).toEqual(tc.expected)
			})
		})
	})

	describe("merge options", () => {
		mergeOptionsTestCases.forEach((tc) => {
			test(tc.name, () => {
				expect(tc.context.merge(tc.input, tc.options)).toEqual(
					tc.expected
				)
			})
		})
	})
})
