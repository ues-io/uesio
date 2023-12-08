import testWireSignal, { WireSignalTest } from "./utils"

const wireId = "mywire"
const collectionId = "ben/planets.exoplanet"

const tests: WireSignalTest[] = [
	{
		name: "Test with wireid",
		wireId,
		wireDef: { collection: collectionId, fields: {} },
		signals: [],
		run: () => (wire, context) => {
			const data = Object.values(wire.data)
			expect(data).toHaveLength(0)
			expect(context.mergeString("$CollectionMeta{mywire:label}")).toBe(
				"Exoplanet"
			)
			expect(
				context.mergeString("$CollectionMeta{mywire:pluralLabel}")
			).toBe("Exoplanets")
		},
	},
	{
		name: "Test with context",
		wireId,
		wireDef: { collection: collectionId, fields: {} },
		signals: [
			{
				signal: "wire/CREATE_RECORD",
				wire: wireId,
			},
		],
		run: () => (wire, context) => {
			const data = Object.values(wire.data)
			expect(data).toHaveLength(1)
			expect(context.mergeString("$CollectionMeta{label}")).toBe(
				"Exoplanet"
			)
			expect(context.mergeString("$CollectionMeta{pluralLabel}")).toBe(
				"Exoplanets"
			)
		},
	},
]

tests.map((el) => test(el.name, () => testWireSignal(el)))
