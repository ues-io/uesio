import testWireSignal, { WireSignalTest } from "./utils"

const WIRE_NAME = "exoplanets"

const tests: WireSignalTest[] = [
	{
		name: "Update record",
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
				signal: "wire/CANCEL",
				wire: WIRE_NAME,
			},
		],
		run: () => (wire) => {
			const records = Object.values(wire.data)
			expect(records).toHaveLength(0)
		},
	},
]

tests.map((el) => test(el.name, () => testWireSignal(el)))
