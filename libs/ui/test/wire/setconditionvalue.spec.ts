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
		name: "Changing the values of a multi-value condition",
		wireId,
		wireDef: {
			collection: collectionId,
			conditions: [
				{
					id: "123",
					field: "ben/planets.name",
					operator: "IN",
					valueSource: "VALUE",
					values: ["kepler", "europa"],
				},
			],
			fields: {},
		},
		signals: [
			{
				signal: "wire/SET_CONDITION_VALUE",
				wire: wireId,
				conditionId: "123",
				values: ["io", "ganymede"],
			},
		],
		run: () => (wire) => () => {
			expect(wire).toMatchObject({
				conditions: [
					{ id: "123", operator: "IN", values: ["io", "ganymede"] },
				],
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
				conditionName: "123",
				wirename: wireId,
			}),
		signals: [
			{
				signal: "wire/SET_CONDITION_VALUE",
				wire: "$SignalOutput{ageCalculation:wirename}",
				conditionId: "$SignalOutput{ageCalculation:conditionName}",
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
	{
		name: "Multi-value condition with values merge from string",
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
			})
			.addSignalOutputFrame("namesFetcher", {
				names: ["Alastair", "Alice"],
				conditionName: "123",
				wirename: wireId,
			}),
		signals: [
			{
				signal: "wire/SET_CONDITION_VALUE",
				wire: "$SignalOutput{namesFetcher:wirename}",
				conditionId: "$SignalOutput{namesFetcher:conditionName}",
				values: "$SignalOutput{namesFetcher:names}",
			},
		],
		run: () => (wire) => {
			expect(wire.conditions).toEqual([
				{
					id: "123",
					field: "ben/planets.name",
					valueSource: "VALUE",
					values: ["Alastair", "Alice"],
				},
			])
		},
	},
]

describe("signals: wire/SET_CONDITION_VALUE", () => {
	tests.map((el) => test(el.name, () => testWireSignal(el)))
})
