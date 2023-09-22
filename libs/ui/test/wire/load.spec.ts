import testWireSignal, {
	WireSignalTest,
	defaultPlainWireProperties,
} from "./utils"
import { getExoplanetCollection } from "../utils/defaults"
import * as api from "../../src/api/api"
import * as platformModule from "../../src/platform/platform"

const wireId = "mywire"
const collectionId = "ben/planets.exoplanet"

const tests: WireSignalTest[] = [
	{
		name: "Load",
		wireId,
		wireDef: { collection: collectionId, fields: {} },
		signals: [
			{
				signal: "wire/LOAD",
				wires: [wireId],
			},
		],
		run: () => {
			const spy = jest
				.spyOn(platformModule.platform, "loadData")
				.mockImplementation(() =>
					Promise.resolve({
						collections: {
							[collectionId]: getExoplanetCollection(),
						},
						wires: [
							{
								...defaultPlainWireProperties,
								view: "myview",
								collection: collectionId,
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
		wireId,
		wireDef: {
			collection: collectionId,
			fields: {},
			conditions: [
				{
					field: "ben/planets.solarsystem",
					valueSource: "LOOKUP",
					lookupWire: "solarsystems",
					lookupField: "ben/planets.name",
				},
			],
		},
		run: () => (wire, context) => {
			const handler = api.signal.getHandler(
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
