import testWireSignal, { WireSignalTest } from "./utils"

const wireId = "mywire"
const collectionId = "ben/planets.exoplanet"

const tests: WireSignalTest[] = [
	{
		name: "Set and remove a condition",
		wireId,
		wireDef: { collection: collectionId, fields: {} },
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
