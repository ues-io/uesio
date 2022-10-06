import testWireSignal, { WireSignalTest } from "./utils"
import { ValueConditionState } from "../../src/wireexports"
import { testEnv } from "../utils/defaults"
const { viewId, wireId, collectionId } = testEnv

const tests: WireSignalTest[] = [
	{
		view: viewId,
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
		view: viewId,

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
		view: viewId,

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
		view: viewId,

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
		view: viewId,

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
				{ id: "123", field: "ben/planets.name", valueSource: "VALUE" },
			])
		},
	},
]

tests.map((el) => test(el.name, () => testWireSignal(el)))
