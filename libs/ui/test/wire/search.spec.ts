import testWireSignal, { WireSignalTest } from "./utils"
import * as platformModule from "../../src/platform/platform"

const wireId = "mywire"
const collectionId = "ben/planets.exoplanet"

const SEARCH_CONDITION_ID = "uesio.search"
const SEARCH_VALUE = "kepler"
const tests: WireSignalTest[] = [
	{
		name: "Search for a string",
		wireId,
		wireDef: { collection: collectionId, fields: {} },
		signals: [
			{
				signal: "wire/SEARCH",
				wire: wireId,
				searchFields: ["ben/planets.name"],
				search: SEARCH_VALUE,
			},
		],
		run: () => {
			const spy = jest
				.spyOn(platformModule.platform, "loadData")
				.mockImplementation(() =>
					// Promise.resolve({
					// 	wires: [],
					// 	collections: [],
					// })
					Promise.reject()
				)

			return (wire) => {
				spy.mockRestore()
				expect(wire.conditions).toMatchObject([
					{
						type: "SEARCH",
						value: SEARCH_VALUE,
						id: SEARCH_CONDITION_ID,
						fields: ["ben/planets.name"],
					},
				])
			}
		},
	},
	{
		name: "Search for a string, then search for empty string",
		wireId,
		wireDef: { collection: collectionId, fields: {} },
		signals: [
			{
				signal: "wire/SEARCH",
				wire: wireId,
				searchFields: ["ben/planets.name"],
				search: SEARCH_VALUE,
			},
			{
				signal: "wire/SEARCH",
				wire: wireId,
				searchFields: ["ben/planets.name"],
				search: "",
			},
		],
		run: () => {
			const spy = jest
				.spyOn(platformModule.platform, "loadData")
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
						value: "",
						id: SEARCH_CONDITION_ID,
						fields: ["ben/planets.name"],
					},
				])
			}
		},
	},
]

tests.map((el) => test(el.name, () => testWireSignal(el)))
