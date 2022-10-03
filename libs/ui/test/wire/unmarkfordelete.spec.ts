import testWireSignal, { WireSignalTest } from "./utils"

import { testEnv } from "../utils/x"
const { viewId, wireId, collectionId, ns } = testEnv

const tests: WireSignalTest[] = [
	{
		view: viewId,
		name: "UNMARK FOR DELETE",
		wireId,
		wireDef: { collection: `${ns}.${collectionId}`, fields: {} },
		signals: [
			{
				signal: "wire/CREATE_RECORD",
				wire: wireId,
			},
			{
				signal: "wire/MARK_FOR_DELETE",
			},
			{
				signal: "wire/UNMARK_FOR_DELETE",
			},
		],
		run: () => (wire) => {
			expect(Object.keys(wire.deletes)).toHaveLength(0)
		},
	},
]

tests.map((el) => test(el.name, () => testWireSignal(el)))
