import testWireSignal, { WireSignalTest } from "./utils"
import { testEnv } from "../utils/defaults"
const { viewId, wireId, collectionId, ns } = testEnv

const tests: WireSignalTest[] = [
	{
		view: viewId,
		// name: "Update record, check data and changes",
		name: "X",
		wireId,
		wireDef: { collection: `${ns}.${collectionId}`, fields: {} },
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
