import testWireSignal, { WireSignalTest } from "./utils"

const wireId = "mywire"
const collectionId = "ben/planets.exoplanet"

const tests: WireSignalTest[] = [
	{
		// name: "Update Fields, check data and changes",
		name: "X",
		wireId,
		wireDef: { collection: collectionId, fields: {} },
		signals: [
			{
				signal: "wire/CREATE_RECORD",
				wire: wireId,
			},
			{
				signal: "wire/UPDATE_FIELDS",
				wire: wireId,
				fields: [
					{ field: "ben/planets.name", value: "Kepler-16b" },
					{ field: "ben/planets.galaxy", value: "Andromeda" },
				],
			},
		],
		run: () => (wire) => {
			const data = Object.values(wire.data)
			expect(data).toHaveLength(1)
			expect(data[0]).toMatchObject({
				"ben/planets.name": "Kepler-16b",
				"ben/planets.galaxy": "Andromeda",
			})
			const changes = Object.values(wire.changes)
			expect(changes).toHaveLength(1)
			expect(changes[0]).toMatchObject({
				"ben/planets.name": "Kepler-16b",
				"ben/planets.galaxy": "Andromeda",
			})
		},
	},
]

tests.map((el) => test(el.name, () => testWireSignal(el)))
