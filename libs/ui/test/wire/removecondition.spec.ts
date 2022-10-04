import testWireSignal, { WireSignalTest } from "./utils"
import { testEnv } from "../utils/defaults"

const { viewId, wireId, collectionId, ns } = testEnv

const tests: WireSignalTest[] = [
	{
		name: "Set and remove a condition",
		wireId,
		view: viewId,

		wireDef: { collection: `${ns}.${collectionId}`, fields: {} },
		signals: [
			{
				signal: "wire/SET_CONDITION",
				wire: wireId,
				condition: {
					id: "123",
				},
			},
			{
				signal: "wire/REMOVE_CONDITION",
				wire: wireId,
				conditionId: "123",
			},
		],
		run: () => (wire) =>
			expect(wire).toMatchObject({
				conditions: {},
			}),
	},
]

tests.map((el) => test(el.name, () => testWireSignal(el)))
