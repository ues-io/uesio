import testWireSignal, { WireSignalTest } from "./utils"
import { testEnv } from "../utils/defaults"

const { viewId, wireId, collectionId, ns } = testEnv

const tests: WireSignalTest[] = [
	{
		name: "adding 1 record",
		wireId,
		view: viewId,

		wireDef: { collection: `${ns}.${collectionId}`, fields: {} },
		signals: [
			{
				signal: "wire/CREATE_RECORD",
				wire: wireId,
			},
			{
				signal: "wire/MARK_FOR_DELETE",
			},
		],
		run: () => (wire) => {
			expect(Object.keys(wire.deletes)).toHaveLength(1)
		},
	},
]

tests.map((el) => test(el.name, () => testWireSignal(el)))
