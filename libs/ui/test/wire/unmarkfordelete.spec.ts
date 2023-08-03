import testWireSignal, { WireSignalTest } from "./utils"

import { testEnv } from "../utils/defaults"
const { viewId, wireId, collectionId, ns } = testEnv

const tests: WireSignalTest[] = [
	{
		view: viewId,
		name: "Unmark for delete - no wire specified",
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
	{
		view: viewId,
		name: "Unmark for delete - wire specified explicitly",
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
				wire: wireId,
			},
		],
		run: () => (wire) => {
			expect(Object.keys(wire.deletes)).toHaveLength(0)
		},
	},
]

describe("wire/UNMARK_FOR_DELETE", () => {
	tests.map((el) => test(el.name, () => testWireSignal(el)))
})
