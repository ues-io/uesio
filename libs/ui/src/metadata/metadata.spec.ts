import { getKey } from "./metadata"

describe("getKey", () => {
	test("happy path", () => {
		expect(getKey({ name: "foo", namespace: "bar/baz" })).toStrictEqual(
			"bar/baz.foo"
		)
	})
	test("no namespace", () => {
		expect(getKey({ name: "foo" })).toStrictEqual("foo")
	})
})
