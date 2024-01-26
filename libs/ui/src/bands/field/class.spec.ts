import { Context } from "../../context/context"
import { SelectListMetadata } from "../../definition/selectlist"
import { create } from "../../store/store"
import Field from "./class"
import { FieldMetadata } from "./types"

const getSelectListFieldMetadata = (
	selectlist: SelectListMetadata
): FieldMetadata => ({
	createable: true,
	accessible: true,
	updateable: true,
	name: "test",
	namespace: "foo/bar",
	label: "Test",
	type: "SELECT",
	selectlist,
})

const getSelectOptionsTests = [
	{
		name: "should add blank option by default",
		field: new Field(
			getSelectListFieldMetadata({
				name: "foo/bar.one_no_blank",
			})
		),
		request: {
			context: new Context(),
		},
		expected: [
			{ label: "", value: "" },
			{ label: "One", value: "one" },
		],
	},
	{
		name: "should not add a blank option if requeested",
		field: new Field(
			getSelectListFieldMetadata({
				name: "foo/bar.one_no_blank",
			})
		),
		request: {
			context: new Context(),
			addBlankOption: false,
		},
		expected: [{ label: "One", value: "one" }],
	},
	{
		name: "should merge language labels, and NOT overwrite label of option with blank value",
		field: new Field(
			getSelectListFieldMetadata({
				name: "foo/bar.two_has_blank",
			})
		),
		request: {
			context: new Context(),
		},
		expected: [
			{ label: "Uno", value: "one" },
			{ label: "Default", value: "" },
		],
	},
	{
		name: "should use SelectList's blank option label",
		field: new Field(
			getSelectListFieldMetadata({
				name: "foo/bar.has_blank_option_label",
			})
		),
		request: {
			context: new Context(),
		},
		expected: [
			{ label: "Select an option", value: "" },
			{ label: "Dos", value: "two" },
		],
	},
	{
		name: "should use SelectList's blank option Language label",
		field: new Field(
			getSelectListFieldMetadata({
				name: "foo/bar.has_blank_option_language_label",
			})
		),
		request: {
			context: new Context(),
		},
		expected: [
			{ label: "Elige una opción", value: "" },
			// It should use the default label if the requested language label is not found
			{ label: "Three", value: "three" },
		],
	},
]

describe("getSelectOptions", () => {
	// Create a default Redux store
	create({
		route: {
			view: "test",
			namespace: "foo/bar",
			path: "/test",
			theme: "default",
			dependencies: {
				label: [
					{ name: "one", namespace: "foo/bar", value: "Uno" },
					{ name: "two", namespace: "foo/bar", value: "Dos" },
					{
						name: "select_an_option",
						namespace: "foo/bar",
						value: "Elige una opción",
					},
				],
				selectlist: [
					{
						name: "one_no_blank",
						namespace: "foo/bar",
						options: [{ label: "One", value: "one" }],
					},
					{
						name: "two_has_blank",
						namespace: "foo/bar",
						options: [
							{
								label: "One",
								value: "one",
								languageLabel: "foo/bar.one",
							},
							{ label: "Default", value: "" },
						],
					},
					{
						name: "has_blank_option_label",
						namespace: "foo/bar",
						blank_option_label: "Select an option",
						options: [
							{
								label: "Two",
								value: "two",
								languageLabel: "foo/bar.two",
							},
						],
					},
					{
						name: "has_blank_option_language_label",
						namespace: "foo/bar",
						blank_option_language_label: "foo/bar.select_an_option",
						options: [
							{
								label: "Three",
								value: "three",
								languageLabel: "foo/bar.three",
							},
						],
					},
				],
			},
		},
	})
	getSelectOptionsTests.forEach((tc) => {
		test(tc.name, () => {
			const actual = tc.field.getSelectOptions(tc.request)
			expect(actual).toEqual(tc.expected)
		})
	})
})
