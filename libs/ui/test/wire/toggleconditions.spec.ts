import testWireSignal, { WireSignalTest } from "./utils"

const WIRE_NAME = "exoplanets"

const tests: WireSignalTest[] = [
	{
		name: "toggling from undefined",
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
				signal: "wire/TOGGLE_CONDITION",
				wire: WIRE_NAME,
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
		name: "toggling from false",
		wireId: WIRE_NAME,
		wireDef: {
			collection: "ben/planets.exoplanets",
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
				wire: WIRE_NAME,
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
		name: "toggling from true",
		wireId: WIRE_NAME,
		wireDef: {
			collection: "ben/planets.exoplanets",
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
				wire: WIRE_NAME,
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
		name: "toggling unexisting",
		wireId: WIRE_NAME,
		wireDef: {
			collection: "ben/planets.exoplanets",
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
				wire: WIRE_NAME,
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
