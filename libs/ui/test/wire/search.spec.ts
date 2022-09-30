import testWireSignal, { WireSignalTest } from "./utils"
import * as platformModule from "../../src/platform/platform"

const WIRE_NAME = "exoplanets"
const SEARCH_CONDITION_ID = "uesio.search"
const SEARCH_VALUE = "kepler"
const tests: WireSignalTest[] = [
	{
		name: "Search for a string",
		wireId: WIRE_NAME,
		wireDef: { collection: "ben/planets.exoplanets", fields: {} },
		signals: [
			{
				signal: "wire/SEARCH",
				wire: WIRE_NAME,
				searchFields: ["ben/planets.name"],
				search: SEARCH_VALUE,
			},
		],
		run: () => {
			const spy = jest
				.spyOn(platformModule.platform, "loadData")
				.mockResolvedValue({ wires: [] } as never)
				.mockImplementation(
					() =>
						Promise.resolve({
							wires: [],
							collections: [],
							// eslint-disable-next-line @typescript-eslint/no-explicit-any
						}) as any
				)
			return (wire) => {
				spy.mockRestore()
				expect(wire.conditions).toMatchObject([
					{
						type: "SEARCH",
						value: SEARCH_VALUE,
						active: true,
						id: SEARCH_CONDITION_ID,
						fields: ["ben/planets.name"],
					},
				])
			}
		},
	},
	{
		name: "Search for a string, then search for empty string",
		wireId: WIRE_NAME,
		wireDef: { collection: "ben/planets.exoplanets", fields: {} },
		signals: [
			{
				signal: "wire/SEARCH",
				wire: WIRE_NAME,
				searchFields: ["ben/planets.name"],
				search: SEARCH_VALUE,
			},
			{
				signal: "wire/SEARCH",
				wire: WIRE_NAME,
				searchFields: ["ben/planets.name"],
				search: "",
			},
		],
		run: () => {
			const spy = jest
				.spyOn(platformModule.platform, "loadData")
				.mockResolvedValue({ wires: [] } as never)
				.mockImplementation(
					() =>
						Promise.resolve({
							wires: [],
							collections: [],
							// eslint-disable-next-line @typescript-eslint/no-explicit-any
						}) as any
				)
			return (wire) => {
				spy.mockRestore()
				expect(wire.conditions).toMatchObject([])
			}
		},
	},
]

tests.map((el) => test(el.name, () => testWireSignal(el)))
