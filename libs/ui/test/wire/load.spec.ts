import testWireSignal, {
	WireSignalTest,
	defaultPlainWireProperties,
} from "./utils"
import { getExoplanetCollection } from "../utils/defaults"
import * as api from "../../src/api/api"
import * as platformModule from "../../src/platform/platform"
import { PlainWire } from "../../src/bands/wire/types"
import { Context } from "../../src/context/context"
import { LoadRequestBatch } from "../../src/load/loadrequest"

const wireId = "mywire"
const collectionId = "ben/planets.exoplanet"

const defaultPlanetsWireLoadImplementation = (
	_ctx: Context,
	requestBody: LoadRequestBatch
) =>
	Promise.resolve({
		// Only add collections if includeMetadata was true
		...(requestBody.includeMetadata
			? {
					collections: {
						[collectionId]: getExoplanetCollection(),
					},
			  }
			: {}),
		wires: [
			{
				...defaultPlainWireProperties,
				view: "myview",
				collection: collectionId,
				name: wireId,
				data: requestBody.wires[0].query
					? {
							record1: {
								"ben/planets.name": "kepler",
							},
							record2: {
								"ben/planets.name": "foobar",
							},
					  }
					: {},
				query: !!requestBody.wires[0].query,
			} as PlainWire,
		],
	})

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
				.mockImplementation(defaultPlanetsWireLoadImplementation)
			return (wire) => {
				expect(spy).toBeCalledTimes(1)
				const loadWire = spy.mock.calls[0][1].wires[0]
				expect(loadWire).toHaveProperty("name", wireId)
				expect(loadWire).toHaveProperty("collection", collectionId)
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
	{
		name: "Load should not request metadata if wire already has loaded it",
		wireId,
		wireDef: {
			collection: collectionId,
			fields: {},
		},
		signals: [
			// First load should request metadata (since wire doesn't yet have it loaded)
			{
				signal: "wire/LOAD",
				wires: [wireId],
			},
			// Second load should NOT request metadata (since wire already has it loaded)
			{
				signal: "wire/LOAD",
				wires: [wireId],
			},
		],
		run: () => {
			const spy = jest
				.spyOn(platformModule.platform, "loadData")
				.mockImplementation(defaultPlanetsWireLoadImplementation)
			return (wire) => {
				expect(spy).toBeCalledTimes(2)
				expect(spy.mock.calls[0][1].includeMetadata).toBe(true)
				expect(spy.mock.calls[1][1].includeMetadata).toBe(false)
				spy.mock.calls.forEach((call) => {
					const loadWire = call[1].wires[0]
					expect(loadWire).toHaveProperty("name", wireId)
					expect(loadWire).toHaveProperty("collection", collectionId)
				})
				spy.mockRestore()
				expect(wire.data).toEqual({
					record1: { "ben/planets.name": "kepler" },
					record2: { "ben/planets.name": "foobar" },
				})
			}
		},
	},
	{
		name: "Load request should not include view only fields",
		wireId,
		wireDef: {
			collection: collectionId,
			fields: {
				// Standard field on the collection
				name: {},
				// View only field
				viewOnly: {
					viewOnly: true,
					type: "CHECKBOX",
					label: "View Only",
				},
			},
		},
		signals: [
			{
				signal: "wire/LOAD",
				wires: [wireId],
			},
		],
		run: () => {
			const spy = jest
				.spyOn(platformModule.platform, "loadData")
				.mockImplementation(defaultPlanetsWireLoadImplementation)
			return (wire) => {
				expect(spy).toBeCalledTimes(1)
				expect(spy.mock.calls[0][1].includeMetadata).toBe(true)
				spy.mock.calls.forEach((call) => {
					const loadWire = call[1].wires[0]
					expect(loadWire).toHaveProperty("name", wireId)
					expect(loadWire).toHaveProperty("collection", collectionId)
					const { fields } = loadWire
					// Verify that the view only field was NOT included
					expect(fields).toHaveLength(1)
					expect(fields[0].id).toBe("name")
				})
				spy.mockRestore()
				expect(wire.data).toEqual({
					record1: { "ben/planets.name": "kepler" },
					record2: { "ben/planets.name": "foobar" },
				})
			}
		},
	},
]

describe("Wire Load", () => {
	tests.map((el) => test(el.name, () => testWireSignal(el)))
})
