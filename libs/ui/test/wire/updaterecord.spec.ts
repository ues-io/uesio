import testWireSignal, { WireSignalTest } from "./utils"

const WIRE_NAME = "exoplanets"

const tests: WireSignalTest[] = [
	{
		name: "Update record, check data and changes",
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
		],
		run: () => (wire) => {
			const data = Object.values(wire.data)
			expect(data).toHaveLength(1)
			expect(data[0]).toMatchObject({
				"ben/planets.name": "Kepler-16b",
			})
			const changes = Object.values(wire.changes)
			expect(changes).toHaveLength(1)
			expect(changes[0]).toMatchObject({
				"ben/planets.name": "Kepler-16b",
			})
		},
	},
]

tests.map((el) => test(el.name, () => testWireSignal(el)))
