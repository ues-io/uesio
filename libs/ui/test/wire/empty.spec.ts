import testWireSignal, { WireSignalTest } from "./utils"

const WIRE_NAME = "exoplanets"

const tests: WireSignalTest[] = [
	{
		name: "Empty after update",
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
				signal: "wire/EMPTY",
				wire: WIRE_NAME,
			},
		],
		run: () => (wire) => {
			expect(wire).toMatchObject({
				data: {},
				changes: {},
				deletes: {},
				errors: {},
			})
		},
	},
	{
		name: "Empty after 2 updates and a delete",
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
				signal: "wire/UPDATE_RECORD",
				wire: WIRE_NAME,
				field: "ben/planets.name",
				value: "GJ 15 A",
			},
			{
				signal: "wire/MARK_FOR_DELETE",
				wire: WIRE_NAME,
			},
			{
				signal: "wire/EMPTY",
				wire: WIRE_NAME,
			},
		],
		run: () => (wire) => {
			expect(wire).toMatchObject({
				data: {},
				changes: {},
				deletes: {},
				errors: {},
			})
		},
	},
]

tests.map((el) => test(el.name, () => testWireSignal(el)))
