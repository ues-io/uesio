import testWireSignal, { WireSignalTest } from "./utils"
import { testEnv } from "../utils/defaults"

const { viewId, wireId, collectionId, ns } = testEnv

const tests: WireSignalTest[] = [
	{
		name: "Update record",
		wireId,
		view: viewId,

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
			{
				signal: "wire/CANCEL",
				wire: wireId,
			},
		],
		run: () => (wire) => {
			const records = Object.values(wire.data)
			expect(records).toHaveLength(0)
		},
	},
]

tests.map((el) => test(el.name, () => testWireSignal(el)))
