import testWireSignal, { WireSignalTest } from "./utils"

const wireId = "mywire"
const collectionId = "ben/planets.exoplanet"

const tests: WireSignalTest[] = [
	{
		name: "Setting a condition",
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
		],
		run: () => (wire) => () => {
			expect(wire).toMatchObject({
				conditions: [{ id: "123" }],
			})
		},
	},
]

tests.map((el) => test(el.name, () => testWireSignal(el)))
