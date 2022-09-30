import testWireSignal, { WireSignalTest } from "./utils"

const WIRE_NAME = "exoplanets"

const tests: WireSignalTest[] = [
	{
		name: "Reset",
		wireId: WIRE_NAME,
		wireDef: { collection: "ben/planets.exoplanets", fields: {} },
		signals: [
			{
				signal: "wire/CREATE_RECORD",
				wire: WIRE_NAME,
			},
			{
				signal: "wire/UPDATE_RECORD",
				wire: WIRE_NAME,
				field: "ben/planets.name",
				value: "Kepler-16b",
			},
			{
				signal: "wire/MARK_FOR_DELETE",
				wire: WIRE_NAME,
			},
			{
				signal: "wire/RESET",
				wire: WIRE_NAME,
			},
		],
		run: () => (wire) => () => {
			expect(wire).toMatchObject({
				data: {},
				changes: {},
				deletes: {},
				errors: {},
			})
		},
	},
	{
		name: "Reset with create on init.",
		wireId: WIRE_NAME,
		wireDef: {
			collection: "ben/planets.exoplanets",
			fields: {},
			init: {
				create: true,
			},
		},
		signals: [
			{
				signal: "wire/CREATE_RECORD",
				wire: WIRE_NAME,
			},
			{
				signal: "wire/UPDATE_RECORD",
				wire: WIRE_NAME,
				field: "ben/planets.name",
				value: "Kepler-16b",
			},
			{
				signal: "wire/MARK_FOR_DELETE",
			},
			{
				signal: "wire/RESET",
				wire: WIRE_NAME,
			},
		],
		run: () => (wire) => {
			expect(wire).toMatchObject({
				deletes: {},
				errors: {},
			})
			expect(Object.keys(wire.changes)).toHaveLength(1)
			expect(Object.keys(wire.data)).toHaveLength(1)
		},
	},
]

tests.map((el) => test(el.name, () => testWireSignal(el)))
