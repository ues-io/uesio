import { Context } from "./context"
import {
	InvalidComponentOutputMsg,
	InvalidSignalOutputMergeMsg,
	parseTwoPartExpression,
} from "./merge"

type parseTwoPartExpressionTestCase = {
	name: string
	input: string
	expected: string[] | undefined
	expectError: string | undefined
}

const parseTwoPartExpressionTests = [
	{
		name: "no delimiters",
		input: "foo",
		expectError: "Invalid Expression",
	},
	{
		name: "bracket delimiters: bad syntax",
		input: "[foo]",
		expectError: "Invalid Expression",
	},
	{
		name: "bracket delimiters: bad syntax",
		input: "[foo][",
		expectError: "Invalid Expression",
	},
	{
		name: "bracket delimiters: bad syntax",
		input: "[foo]",
		expectError: "Invalid Expression",
	},
	{
		name: "bracket delimiters: bad syntax",
		input: "foo][bar]",
		expectError: "Invalid Expression",
	},
	{
		name: "bracket delimiters: happy path",
		input: "[foo:foo][bar]",
		expected: ["foo:foo", "bar"],
	},
	{
		name: "colon delimiter: happy path",
		input: "foo:bar",
		expected: ["foo", "bar"],
	},
] as parseTwoPartExpressionTestCase[]

describe("parseTwoPartExpression", () => {
	parseTwoPartExpressionTests.forEach((tc) => {
		test(tc.name, () => {
			let errCaught
			let actual
			try {
				actual = parseTwoPartExpression(tc.input)
			} catch (e) {
				errCaught = e
			}
			expect(errCaught).toEqual(tc.expectError)
			expect(actual).toEqual(tc.expected)
		})
	})
})

type MergeWithContextTestCase = {
	name: string
	context: Context
	expected: string | undefined
	input: string
	expectError: string | undefined
}

const signalOutputContextHappyPath = new Context().addSignalOutputFrame(
	"myStep",
	{
		foo: "bar",
	}
)

const signalOutputMergeTestCases = [
	{
		name: "happy path - colon delimiter",
		context: signalOutputContextHappyPath,
		input: "$SignalOutput{myStep:foo}",
		expected: "bar",
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
] as MergeWithContextTestCase[]

describe("context.merge: $SignalOutput", () => {
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

describe("context.merge: $ComponentOutput", () => {
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
