import testWireSignal, { WireSignalTest } from "./utils"
import { testEnv } from "../utils/defaults"

const { viewId, wireId, collectionId } = testEnv

const tests: WireSignalTest[] = [
	{
		name: "Add order false",
		wireId,

		wireDef: {
			collection: collectionId,
			// Todo, do we need a field?
			fields: { "ben/planets.name": null },
		},
		signals: [
			{
				signal: "wire/ADD_ORDER",
				wire: wireId,
				field: "ben/planets.name",
				desc: false,
			},
		],
		view: viewId,

		run: () => (wire) => {
			expect(wire.order).toEqual([
				{ field: "ben/planets.name", desc: false },
			])
		},
	},
	{
		name: "Add order true",
		wireId,
		view: viewId,

		wireDef: {
			collection: collectionId,
			fields: { "ben/planets.name": null },
		},
		signals: [
			{
				signal: "wire/ADD_ORDER",
				wire: wireId,
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
