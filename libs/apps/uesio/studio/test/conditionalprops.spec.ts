import { propsToRender } from "../bundle/components/shared/buildproparea/proplist"
import { builder, definition } from "@uesio/ui"

type Test = {
	conditionProperties: builder.PropDescriptor[]
	conditionValues: definition.DefinitionMap
	expectedLength: number
}

const equalsTrue: Test = {
	conditionProperties: [
		{
			name: "foo",
			type: "TEXT",
			label: "",
			display: [
				{
					property: "name",
					value: "foo",
				},
			],
		},
	],
	conditionValues: {
		name: "foo",
	},
	expectedLength: 1,
}
const equalsFalse: Test = {
	conditionProperties: [
		{
			name: "name",
			type: "TEXT",
			label: "",
			display: [
				{
					property: "name",
					value: "foo",
				},
			],
		},
	],
	conditionValues: {
		name: "somethingElse",
	},
	expectedLength: 0,
}
const setTrue: Test = {
	conditionProperties: [
		{
			name: "foo",
			type: "TEXT",
			label: "",
			display: [
				{
					type: "SET",
					property: "name",
				},
			],
		},
	],
	conditionValues: {
		name: "somethingElse",
	},
	expectedLength: 1,
}
const setFalse: Test = {
	conditionProperties: [
		{
			name: "name",
			type: "TEXT",
			label: "",
			display: [
				{
					type: "SET",
					property: "quak",
				},
			],
		},
	],
	conditionValues: {
		name: "somethingElse",
	},
	expectedLength: 0,
}
const blankTrue: Test = {
	conditionProperties: [
		{
			name: "name",
			type: "TEXT",
			label: "",
			display: [
				{
					type: "BLANK",
					property: "name",
				},
			],
		},
	],
	conditionValues: {
		name: "",
	},
	expectedLength: 1,
}
const blankFalse: Test = {
	conditionProperties: [
		{
			name: "name",
			type: "TEXT",
			label: "",
			display: [
				{
					type: "BLANK",
					property: "name",
				},
			],
		},
	],
	conditionValues: {
		name: "Chuck",
	},
	expectedLength: 0,
}
const blankFalseBoolean: Test = {
	conditionProperties: [
		{
			name: "name",
			type: "TEXT",
			label: "",
			display: [
				{
					type: "BLANK",
					property: "name",
				},
			],
		},
	],
	conditionValues: {
		name: false,
	},
	expectedLength: 0,
}
const notBlankTrue: Test = {
	conditionProperties: [
		{
			name: "surname",
			type: "TEXT",
			label: "",
			display: [
				{
					type: "NOT_BLANK",
					property: "name",
				},
			],
		},
	],
	conditionValues: {
		name: "jimmy",
	},
	expectedLength: 1,
}
const notBlankFalse: Test = {
	conditionProperties: [
		{
			name: "surname",
			type: "TEXT",
			label: "",
			display: [
				{
					type: "NOT_BLANK",
					property: "name",
				},
			],
		},
	],
	conditionValues: {
		name: "",
	},
	expectedLength: 0,
}
const notBlankBooleanTrue: Test = {
	conditionProperties: [
		{
			name: "surname",
			type: "TEXT",
			label: "",
			display: [
				{
					type: "NOT_BLANK",
					property: "name",
				},
			],
		},
	],
	conditionValues: {
		name: false,
	},
	expectedLength: 1,
}

const notEqualsTrue: Test = {
	conditionProperties: [
		{
			name: "surname",
			type: "TEXT",
			label: "",
			display: [
				{
					type: "NOT_EQUALS",
					property: "name",
					value: "jimmy",
				},
			],
		},
	],
	conditionValues: {
		name: "chuck",
	},
	expectedLength: 1,
}

const notEqualsFalse: Test = {
	conditionProperties: [
		{
			name: "surname",
			type: "TEXT",
			label: "",
			display: [
				{
					type: "NOT_EQUALS",
					property: "name",
					value: "jimmy",
				},
			],
		},
	],
	conditionValues: {
		name: "jimmy",
	},
	expectedLength: 0,
}
const includesTrue: Test = {
	conditionProperties: [
		{
			name: "surname",
			type: "TEXT",
			label: "",
			display: [
				{
					type: "INCLUDES",
					property: "name",
					values: ["jimmy"],
				},
			],
		},
	],
	conditionValues: {
		names: ["jimmy", "Tom"],
	},
	expectedLength: 1,
}
const includesFalse: Test = {
	conditionProperties: [
		{
			name: "surname",
			type: "TEXT",
			label: "",
			display: [
				{
					type: "INCLUDES",
					property: "names",
					values: ["chuck"],
				},
			],
		},
	],
	conditionValues: {
		names: ["jimmy", "Tom"],
	},
	expectedLength: 0,
}

const tests = {
	equalsTrue,
	equalsFalse,
	setTrue,
	setFalse,
	blankTrue,
	blankFalse,
	blankFalseBoolean,
	notBlankTrue,
	notBlankFalse,
	notBlankBooleanTrue,
	notEqualsFalse,
	notEqualsTrue,
	includesTrue,
	includesFalse,
}

Object.entries(tests).map(
	([testName, { conditionProperties, conditionValues, expectedLength }]) =>
		test(testName, () => {
			const length = propsToRender(
				conditionProperties,
				conditionValues
			).length
			expect(expectedLength).toStrictEqual(length)
		})
)
