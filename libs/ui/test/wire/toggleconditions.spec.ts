import testWireSignal, { WireSignalTest } from "./utils"

import { testEnv } from "../utils/x"
const { viewId, wireId, collectionId } = testEnv

const tests: WireSignalTest[] = [
	{
		view: viewId,
		name: "toggling from undefined",
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
				signal: "wire/TOGGLE_CONDITION",
				wire: wireId,
				conditionId: "123",
			},
		],
		run: () => (wire) =>
			expect(wire).toMatchObject({
				conditions: [
					{
						id: "123",
						field: "ben/planets.name",
						valueSource: "VALUE",
						value: "kepler",
						active: true,
					},
				],
			}),
	},
	{
		view: viewId,

		name: "toggling from false",
		wireId,
		wireDef: {
			collection: collectionId,
			conditions: [
				{
					id: "123",
					field: "ben/planets.name",
					valueSource: "VALUE",
					value: "kepler",
					active: false,
				},
			],
			fields: {},
		},
		signals: [
			{
				signal: "wire/TOGGLE_CONDITION",
				wire: wireId,
				conditionId: "123",
			},
		],
		run: () => (wire) =>
			expect(wire).toMatchObject({
				conditions: [
					{
						id: "123",
						field: "ben/planets.name",
						valueSource: "VALUE",
						value: "kepler",
						active: true,
					},
				],
			}),
	},
	{
		view: viewId,

		name: "toggling from true",
		wireId,
		wireDef: {
			collection: collectionId,
			conditions: [
				{
					id: "123",
					field: "ben/planets.name",
					valueSource: "VALUE",
					value: "kepler",
					active: true,
				},
			],
			fields: {},
		},
		signals: [
			{
				signal: "wire/TOGGLE_CONDITION",
				wire: wireId,
				conditionId: "123",
			},
		],
		run: () => (wire) =>
			expect(wire).toMatchObject({
				conditions: [
					{
						id: "123",
						field: "ben/planets.name",
						valueSource: "VALUE",
						value: "kepler",
						active: false,
					},
				],
			}),
	},
	{
		view: viewId,
		name: "toggling unexisting",
		wireId,
		wireDef: {
			collection: collectionId,
			conditions: [
				{
					id: "000",
					field: "ben/planets.name",
					valueSource: "VALUE",
					value: "kepler",
					active: false,
				},
			],
			fields: {},
		},
		signals: [
			{
				signal: "wire/TOGGLE_CONDITION",
				wire: wireId,
				conditionId: "123",
			},
		],
		run: () => (wire) =>
			expect(wire.conditions).toEqual([
				{
					id: "000",
					field: "ben/planets.name",
					valueSource: "VALUE",
					value: "kepler",
					active: false,
				},
			]),
	},
]

tests.map((el) => test(el.name, () => testWireSignal(el)))
