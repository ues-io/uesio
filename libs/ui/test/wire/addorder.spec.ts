import testWireSignal, { WireSignalTest } from "./utils"

const WIRE_NAME = "exoplanets"

const tests: WireSignalTest[] = [
	{
		name: "Add order false",
		wireId: WIRE_NAME,

		wireDef: {
			collection: "ben/planets.exoplanets",
			fields: { "ben/planets.name": null },
		},
		signals: [
			{
				signal: "wire/ADD_ORDER",
				wire: WIRE_NAME,
				field: "ben/planets.name",
				desc: false,
			},
		],
		run: () => (wire) => {
			expect(wire.order).toEqual([
				{ field: "ben/planets.name", desc: false },
			])
		},
	},
	{
		name: "Add order true",
		wireId: WIRE_NAME,

		wireDef: {
			collection: "ben/planets.exoplanets",
			fields: { "ben/planets.name": null },
		},
		signals: [
			{
				signal: "wire/ADD_ORDER",
				wire: WIRE_NAME,
				field: "ben/planets.name",
				desc: true,
			},
		],
		run: () => (wire) => {
			expect(wire.order).toEqual([
				{ field: "ben/planets.name", desc: true },
			])
		},
	},
]

tests.map((el) => test(el.name, () => testWireSignal(el)))
