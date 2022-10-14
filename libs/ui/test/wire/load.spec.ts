import testWireSignal, {
	WireSignalTest,
	defaultPlainWireProperties,
} from "./utils"
import { getCollection, testEnv } from "../utils/defaults"
import { useUesio } from "../../src/hooks/hooks"
import * as platformModule from "../../src/platform/platform"

const { viewId, wireId, collectionId, ns } = testEnv

const tests: WireSignalTest[] = [
	{
		name: "Load",
		view: viewId,
		wireId,
		wireDef: { collection: `${ns}.${collectionId}`, fields: {} },
		signals: [
			{
				signal: "wire/LOAD",
				wires: [wireId],
			},
		],
		run: () => {
			const spy = jest
				.spyOn(platformModule.platform, "loadData")
				.mockResolvedValue({ wires: [] } as never)
				.mockImplementation(() =>
					Promise.resolve({
						collections: {
							"ben/planets.exoplanet": getCollection(),
						},
						wires: [
							{
								...defaultPlainWireProperties,
								view: viewId,
								collection: `${ns}.${collectionId}`,
								name: wireId,
								data: {
									record1: {
										"ben/planets.name": "kepler",
									},
									record2: {
										"ben/planets.name": "foobar",
									},
								},
							},
						],
					})
				)
			console.log(`${ns}.${collectionId}`)
			return (wire) => {
				expect(spy).toBeCalledTimes(1)
				spy.mockRestore()
				expect(wire.data).toEqual({
					record1: { "ben/planets.name": "kepler" },
					record2: { "ben/planets.name": "foobar" },
				})
			}
		},
	},
	{
		name: "Check if the error is thrown when the lookup wires are missing from the load",
		view: viewId,
		wireId,
		wireDef: {
			collection: `${ns}.${collectionId}`,
			fields: {},
			conditions: [
				{
					field: "ben/planets.solarsystem",
					valueSource: "LOOKUP",
					lookupWire: "solarsystems",
					lookupField: "ben/planets.name",
					includeLookupOnLoad: false,
				},
			],
		},
		run: () => (wire, context) => {
			const uesio = useUesio({
				context,
			})
			const handler = uesio.signal.getHandler(
				[
					{
						signal: "wire/LOAD",
						wires: [wireId],
					},
				],
				context
			)
			if (!handler) throw new Error("No signal handler")
			try {
				handler()
			} catch (e) {
				expect(e).toEqual({
					code: `Wire dependency error, check the table above`,
				})
			}
		},
	},
]

tests.map((el) => test(el.name, () => testWireSignal(el)))
