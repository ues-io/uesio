import testWireSignal, { WireSignalTest } from "./utils"

const wireId = "mywire"
const collectionId = "ben/planets.exoplanet"

const tests: WireSignalTest[] = [
	{
		name: "Reset",
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
				signal: "wire/RESET",
				wire: wireId,
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
		wireId,
		wireDef: {
			collection: collectionId,
			fields: {},
			init: {
				create: true,
			},
		},
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
			},
			{
				signal: "wire/RESET",
				wire: wireId,
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
