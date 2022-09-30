import testWireSignal, { WireSignalTest } from "./utils"

const WIRE_NAME = "exoplanets"

const tests: WireSignalTest[] = [
	{
		name: "Setting a condition",
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
		],
		run: () => (wire) => () => {
			expect(wire).toMatchObject({
				conditions: [{ id: "123" }],
			})
		},
	},
]

tests.map((el) => test(el.name, () => testWireSignal(el)))
