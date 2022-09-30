import testWireSignal, { WireSignalTest } from "./utils"

const WIRE_NAME = "exoplanets"

const tests: WireSignalTest[] = [
	{
		name: "adding 1 record",
		wireId: WIRE_NAME,

		wireDef: { collection: "ben/planets.exoplanets", fields: {} },
		signals: [
			{
				signal: "wire/CREATE_RECORD",
				wire: WIRE_NAME,
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
