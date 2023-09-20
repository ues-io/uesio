import testWireSignal, { WireSignalTest } from "./utils"
import { ValueConditionState } from "../../src/wireexports"
import { Context } from "../../src/context/context"

const wireId = "mywire"
const collectionId = "ben/planets.exoplanet"

const tests: WireSignalTest[] = [
	{
		name: "Changing the value of a condition to a string",
		wireId,
		wireDef: {
			collection: collectionId,
			conditions: [
				{
					id: "123",
					field: "ben/planets.name",
					valueSource: "VALUE",
					value: "kepler",
				},
			],
			fields: {},
		},
		signals: [
			{
				signal: "wire/SET_CONDITION_VALUE",
				wire: wireId,
				conditionId: "123",
				value: "Foobar",
			},
		],
		run: () => (wire) => () => {
			expect(wire).toMatchObject({
				conditions: [{ id: "123", value: "Foobar" }],
			})
		},
	},
	{
		name: "Changing the value of a condition to a number",
		wireId,
		wireDef: {
			collection: collectionId,
			conditions: [
				{
					id: "123",
					field: "ben/planets.name",
					valueSource: "VALUE",
					value: "kepler",
				},
			],
			fields: {},
		},
		signals: [
			{
				signal: "wire/SET_CONDITION_VALUE",
				wire: wireId,
				conditionId: "123",
				value: 100,
			},
		],
		run: () => (wire) => () => {
			expect(wire).toMatchObject({
				conditions: [{ id: "123", value: 100 }],
			})
		},
	},
	{
		name: "Changing the value of a condition to undefined",
		wireId,
		wireDef: {
			collection: collectionId,
			conditions: [
				{
					id: "123",
					field: "ben/planets.name",
					valueSource: "VALUE",
					value: "kepler",
				},
			],
			fields: {},
		},
		signals: [
			{
				signal: "wire/SET_CONDITION_VALUE",
				wire: wireId,
				conditionId: "123",
				value: undefined,
			},
		],
		run: () => (wire) => () => {
			expect(wire).toMatchObject({
				conditions: [{ id: "123", value: "kepler" }],
			})
		},
	},
	{
		name: "Changing the value of an unexisting condition",
		wireId,
		wireDef: {
			collection: collectionId,
			conditions: [
				{
					id: "123",
					field: "ben/planets.name",
					valueSource: "VALUE",
					value: "kepler",
				},
			],
			fields: {},
		},
		signals: [
			{
				signal: "wire/SET_CONDITION_VALUE",
				wire: wireId,
				conditionId: "999",
				value: "Foobar",
			},
		],
		run: () => (wire) => () => {
			expect(wire.conditions).toEqual([
				{
					id: "123",
					field: "ben/planets.name",
					valueSource: "VALUE",
					value: "kepler",
				},
			])
		},
	},
	{
		name: "Changing the value of a condition without a value key",
		wireId,
		wireDef: {
			collection: collectionId,
			conditions: [
				{
					id: "123",
					field: "ben/planets.name",
					valueSource: "VALUE",
				} as ValueConditionState,
			],
			fields: {},
		},
		signals: [
			{
				signal: "wire/SET_CONDITION_VALUE",
				wire: wireId,
				conditionId: "123",
				value: "Foobar",
			},
		],
		run: () => (wire) => {
			expect(wire.conditions).toEqual([
				{
					id: "123",
					field: "ben/planets.name",
					valueSource: "VALUE",
					value: "Foobar",
				},
			])
		},
	},
	{
		name: "Set the value of a condition with merge",
		wireId,
		wireDef: {
			collection: collectionId,
			conditions: [
				{
					id: "123",
					field: "ben/planets.name",
					valueSource: "VALUE",
				} as ValueConditionState,
			],
			fields: {},
		},
		context: new Context()
			.addViewFrame({
				view: "myview",
				viewDef: "viewdef",
				params: {
					first: "Luigi",
					last: "Vampa",
				},
			})
			.addSignalOutputFrame("ageCalculation", {
				age: 37,
			}),
		signals: [
			{
				signal: "wire/SET_CONDITION_VALUE",
				wire: wireId,
				conditionId: "123",
				value: "$Param{first} $Param{last} (Age: $SignalOutput{ageCalculation:age})",
			},
		],
		run: () => (wire) => {
			expect(wire.conditions).toEqual([
				{
					id: "123",
					field: "ben/planets.name",
					valueSource: "VALUE",
					value: "Luigi Vampa (Age: 37)",
				},
			])
		},
	},
]

describe("setConditionValue", () => {
	tests.map((el) => test(el.name, () => testWireSignal(el)))
})
