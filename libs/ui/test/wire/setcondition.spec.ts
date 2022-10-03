import testWireSignal, { WireSignalTest } from "./utils"

import { testEnv } from "../utils/x"
const { viewId, wireId, collectionId, ns } = testEnv

const tests: WireSignalTest[] = [
	{
		view: viewId,
		name: "Setting a condition",
		wireId,
		wireDef: { collection: `${ns}.${collectionId}`, fields: {} },
		signals: [
			{
				signal: "wire/SET_CONDITION",
				wire: wireId,
				condition: {
					id: "123",
				},
			},
		],
		run: () => (wire) => () => {
			expect(wire).toMatchObject({
				conditions: [{ id: "123" }],
			})
		},
	},
]

tests.map((el) => test(el.name, () => testWireSignal(el)))
