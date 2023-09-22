import testWireSignal, { WireSignalTest } from "./utils"

const wireId = "mywire"
const collectionId = "ben/planets.exoplanet"

const tests: WireSignalTest[] = [
	{
		name: "Empty after update",
		wireId,
		wireDef: { collection: collectionId, fields: {} },
		signals: [
			{
				signal: "wire/CREATE_RECORD",
				wire: wireId,
			},
			{
				signal: "wire/UPDATE_RECORD",
				wire: wireId,
				field: "ben/planets.name",
				value: "Kepler-16b",
			},
			{
				signal: "wire/MARK_FOR_DELETE",
				wire: wireId,
			},
			{
				signal: "wire/EMPTY",
				wire: wireId,
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
		wireId,
		wireDef: { collection: collectionId, fields: {} },
		signals: [
			{
				signal: "wire/CREATE_RECORD",
				wire: wireId,
			},
			{
				signal: "wire/UPDATE_RECORD",
				wire: wireId,
				field: "ben/planets.name",
				value: "Kepler-16b",
			},
			{
				signal: "wire/UPDATE_RECORD",
				wire: wireId,
				field: "ben/planets.name",
				value: "GJ 15 A",
			},
			{
				signal: "wire/MARK_FOR_DELETE",
				wire: wireId,
			},
			{
				signal: "wire/EMPTY",
				wire: wireId,
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
