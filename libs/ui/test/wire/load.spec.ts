import testWireSignal, {
	WireSignalTest,
	defaultPlainWireProperties,
	defaultCollectionResponse,
	defaultFieldMetadata,
} from "./utils"
import { useUesio } from "../../src/hooks/hooks"

import * as platformModule from "../../src/platform/platform"

const WIRE_NAME = "exoplanets"

const tests: WireSignalTest[] = [
	{
		name: "Load",
		wireId: WIRE_NAME,
		wireDef: { collection: "ben/planets.exoplanets", fields: {} },
		signals: [
			{
				signal: "wire/LOAD",
				wires: [WIRE_NAME],
			},
		],
		run: () => {
			const spy = jest
				.spyOn(platformModule.platform, "loadData")
				.mockResolvedValue({ wires: [] } as never)
				.mockImplementation(() =>
					Promise.resolve({
						collections: {
							"ben/planets.exoplanets": {
								...defaultCollectionResponse,
								name: "exoplanets",
								namespace: "ben/planets",
								nameField: "ben/planets.name",
								fields: {
									"ben/planets.name": defaultFieldMetadata,
								},
							},
						},
						wires: [
							{
								...defaultPlainWireProperties,
								view: "allPlanets",
								collection: "ben/planets.exoplanets",
								name: WIRE_NAME,
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
		wireId: WIRE_NAME,
		wireDef: {
			collection: "ben/planets.exoplanets",
			fields: {},
			conditions: [
				{
					field: "ben/planets.name",
					valueSource: "LOOKUP",
					lookupWire: "solarsystems",
					lookupField: "ben/planets.solarsystem",
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
						wires: [WIRE_NAME],
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
