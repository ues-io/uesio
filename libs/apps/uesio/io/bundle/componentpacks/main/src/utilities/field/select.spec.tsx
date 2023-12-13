import { addSelectedValueToOptions, addSelectedValuesToOptions } from "./select"

describe("addSelectedValueToOptions", () => {
	;[
		{
			name: "retain original options if value is present",
			options: [
				{ value: "foo", label: "FOO" },
				{ value: "bar", label: "BAR" },
			],
			value: "foo",
			expected: [
				{ value: "foo", label: "FOO" },
				{ value: "bar", label: "BAR" },
			],
		},
		{
			name: "add to original options if value is NOT present",
			options: [
				{ value: "foo", label: "FOO" },
				{ value: "bar", label: "BAR" },
			],
			value: "baz",
			expected: [
				{ value: "foo", label: "FOO" },
				{ value: "bar", label: "BAR" },
				{ disabled: true, value: "baz", label: "baz" },
			],
		},
		{
			name: "add to empty options if value is NOT present",
			options: [],
			value: "baz",
			expected: [{ disabled: true, value: "baz", label: "baz" }],
		},
	].forEach((tc) => {
		it(tc.name, () => {
			expect(addSelectedValueToOptions(tc.options, tc.value)).toEqual(
				tc.expected
			)
		})
	})
})

describe("addSelectedValuesToOptions", () => {
	;[
		{
			name: "retain original options if values are present",
			options: [
				{ value: "foo", label: "FOO" },
				{ value: "bar", label: "BAR" },
			],
			values: ["foo", "bar"],
			expected: [
				{ value: "foo", label: "FOO" },
				{ value: "bar", label: "BAR" },
			],
		},
		{
			name: "add to original options if values are NOT present",
			options: [
				{ value: "foo", label: "FOO" },
				{ value: "bar", label: "BAR" },
			],
			values: ["baz"],
			expected: [
				{ value: "foo", label: "FOO" },
				{ value: "bar", label: "BAR" },
				{ disabled: true, value: "baz", label: "baz" },
			],
		},
		{
			name: "only add missing values",
			options: [
				{ value: "foo", label: "FOO" },
				{ value: "bar", label: "BAR" },
			],
			values: ["foo", "baz"],
			expected: [
				{ value: "foo", label: "FOO" },
				{ value: "bar", label: "BAR" },
				{ disabled: true, value: "baz", label: "baz" },
			],
		},
		{
			name: "add to empty options if value is NOT present",
			options: [],
			values: ["baz"],
			expected: [{ disabled: true, value: "baz", label: "baz" }],
		},
	].forEach((tc) => {
		it(tc.name, () => {
			expect(addSelectedValuesToOptions(tc.options, tc.values)).toEqual(
				tc.expected
			)
		})
	})
})
