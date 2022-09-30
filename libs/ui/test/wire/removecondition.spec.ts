import testWireSignal, { WireSignalTest } from "./utils"

const WIRE_NAME = "exoplanets"

const tests: WireSignalTest[] = [
	{
		name: "Set and remove a condition",
		wireId: WIRE_NAME,

		wireDef: { collection: "ben/planets.exoplanets", fields: {} },
		signals: [
			{
				signal: "wire/SET_CONDITION",
				wire: WIRE_NAME,
				condition: {
					id: "123",
				},
			},
			{
				signal: "wire/REMOVE_CONDITION",
				wire: WIRE_NAME,
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
