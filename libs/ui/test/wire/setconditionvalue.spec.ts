import testWireSignal, { WireSignalTest } from "./utils"
const WIRE_NAME = "exoplanets"
import { ValueConditionState } from "../../src/wireexports"
const tests: WireSignalTest[] = [
	{
		name: "Changing the value of a condition to a string",
		wireId: WIRE_NAME,
		wireDef: {
			collection: "ben/planets.exoplanets",
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
				wire: WIRE_NAME,
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
		wireId: WIRE_NAME,
		wireDef: {
			collection: "ben/planets.exoplanets",
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
				wire: WIRE_NAME,
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
		wireId: WIRE_NAME,
		wireDef: {
			collection: "ben/planets.exoplanets",
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
				wire: WIRE_NAME,
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
		wireId: WIRE_NAME,
		wireDef: {
			collection: "ben/planets.exoplanets",
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
				wire: WIRE_NAME,
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
		wireId: WIRE_NAME,
		wireDef: {
			collection: "ben/planets.exoplanets",
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
				wire: WIRE_NAME,
				conditionId: "123",
				value: "Foobar",
			},
		],
		run: () => (wire) => {
			expect(wire.conditions).toEqual([
				{ id: "123", field: "ben/planets.name", valueSource: "VALUE" },
			])
		},
	},
]

tests.map((el) => test(el.name, () => testWireSignal(el)))
