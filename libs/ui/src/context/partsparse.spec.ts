import {
  parseOneOrTwoPartExpression,
  parseOnePartExpression,
  parseTwoPartExpression,
} from "./partsparse"

type ParseExpressionTestCase = {
  name: string
  input: string
  expected?: string[]
  expectError?: string
}

const parseOnePartExpressionTests: ParseExpressionTestCase[] = [
  {
    name: "no delimiters",
    input: "foo",
    expected: ["foo"],
  },
  {
    name: "bracket delimiters: bad syntax 1",
    input: "fo]",
    expectError: "Invalid Expression",
  },
  {
    name: "bracket delimiters: bad syntax 2",
    input: "[foo][",
    expectError: "Invalid Expression",
  },
  {
    name: "bracket delimiters: bad syntax 3",
    input: "foo][bar]",
    expectError: "Invalid Expression",
  },
  {
    name: "bracket delimiters: happy path",
    input: "[foo:foo]",
    expected: ["foo:foo"],
  },
  {
    name: "bracket delimiters: happy path 2",
    input: "[food]",
    expected: ["food"],
  },
  {
    name: "colon delimiter: happy path",
    input: "bar",
    expected: ["bar"],
  },
]

describe("parseOnePartExpression", () => {
  parseOnePartExpressionTests.forEach((tc) => {
    test(tc.name, () => {
      let errCaught
      let actual
      try {
        actual = parseOnePartExpression(tc.input)
      } catch (e) {
        errCaught = e
      }
      expect(errCaught).toEqual(tc.expectError)
      expect(actual).toEqual(tc.expected)
    })
  })
})

const parseTwoPartExpressionTests: ParseExpressionTestCase[] = [
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
]

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

const parseOneOrTwoPartExpressionTests: ParseExpressionTestCase[] = [
  {
    name: "no delimiters",
    input: "foo",
    expected: ["foo"],
  },
  {
    name: "bracket delimiters: bad syntax 1",
    input: "fo]",
    expectError: "Invalid Expression",
  },
  {
    name: "bracket delimiters: bad syntax 2",
    input: "[foo][",
    expectError: "Invalid Expression",
  },
  {
    name: "bracket delimiters: bad syntax 3",
    input: "foo][bar]",
    expectError: "Invalid Expression",
  },
  {
    name: "bracket delimiters: happy path",
    input: "[foo:foo]",
    expected: ["[foo", "foo]"],
  },
  {
    name: "bracket delimiters: happy path 2",
    input: "[food]",
    expected: ["food"],
  },
  {
    name: "colon delimiter: happy path",
    input: "bar",
    expected: ["bar"],
  },
  {
    name: "normal two part bracket delimiter: happy path",
    input: "[data][value]",
    expected: ["data", "value"],
  },
  {
    name: "normal two part colon delimiter: happy path",
    input: "data:value",
    expected: ["data", "value"],
  },
]

describe("parseOneOrTwoPartExpression", () => {
  parseOneOrTwoPartExpressionTests.forEach((tc) => {
    test(tc.name, () => {
      let errCaught
      let actual
      try {
        actual = parseOneOrTwoPartExpression(tc.input)
      } catch (e) {
        errCaught = e
      }
      expect(errCaught).toEqual(tc.expectError)
      expect(actual).toEqual(tc.expected)
    })
  })
})
