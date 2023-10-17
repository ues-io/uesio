import testWireSignal, {
	WireSignalTest,
	defaultPlainWireProperties,
} from "./utils"
import {
	NS,
	getCollectionSlice,
	getExoplanetCollection,
	getGalaxyCollection,
} from "../utils/defaults"
import * as api from "../../src/api/api"
import * as platformModule from "../../src/platform/platform"
import { PlainWire, ServerWire } from "../../src/bands/wire/types"
import { InitialState } from "../../src/store/store"
import { RouteState } from "../../src/bands/route/types"
import { ViewDefinition } from "../../src/definition/view"

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
				.mockImplementation((_ctx, requestBody) =>
					Promise.resolve({
						// Only add collections if includeMetadata was true
						...(requestBody.includeMetadata
							? {
									collections: {
										[collectionId]:
											getExoplanetCollection(),
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
				)
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
		name: "Load should pre-process top-level Lookup Conditions",
		initialState: {
			route: {
				view: "myview",
				name: "myroute",
				namespace: NS,
				title: "foo",
				tags: [],
				path: "myroute",
				theme: "default",
				dependencies: {
					collection: getCollectionSlice(),
					viewdef: [
						{
							name: "myview",
							definition: {
								wires: {
									galaxy: {
										collection: `${NS}.galaxy`,
										fields: {},
										conditions: [
											{
												field: "ben/planets.name",
												value: "Milky Way",
												valueSource: "VALUE",
											},
										],
									},
								},
								components: [],
							} as ViewDefinition,
						},
					],
					wire: [
						{
							collection: `${NS}.galaxy`,
							name: "galaxy",
							conditions: [
								{
									field: "ben/planets.name",
									value: "Milky Way",
									valueSource: "VALUE",
								},
							],
							fields: [],
							batchsize: 1,
							batchid: "123",
							batchnumber: 1,
							query: true,
							preloaded: true,
							data: [],
							view: "myview",
						},
					] as ServerWire[],
				},
			} as RouteState,
		} as InitialState,
		wireId,
		wireDef: {
			conditions: [
				{
					field: "ben/planets.galaxy",
					valueSource: "LOOKUP",
					lookupWire: "galaxy",
					lookupField: "uesio/core.id",
				},
			],
			collection: collectionId,
			fields: {},
			init: {
				query: true,
			},
		},
		signals: [
			// The wire load request should also load the Lookup wire
			{
				signal: "wire/LOAD",
				wires: [wireId],
			},
		],
		run: () => {
			const spy = jest
				.spyOn(platformModule.platform, "loadData")
				.mockImplementation((_ctx, requestBody) =>
					Promise.resolve({
						// Only add collections if includeMetadata was true
						...(requestBody.includeMetadata
							? {
									collections: {
										[collectionId]:
											getExoplanetCollection(),
										[`${NS}.galaxy`]: getGalaxyCollection(),
									},
							  }
							: {}),
						wires: [
							{
								...defaultPlainWireProperties,
								view: "myview",
								collection: requestBody.wires[0].collection,
								name: requestBody.wires[0].name,
								data: requestBody.wires[0].query
									? {
											record3: {
												"ben/planets.name": "Milky Way",
											},
									  }
									: {},
								query: !!requestBody.wires[0].query,
							} as PlainWire,
							{
								...defaultPlainWireProperties,
								view: "myview",
								collection: requestBody.wires[1].collection,
								name: requestBody.wires[1].name,
								data: requestBody.wires[1].query
									? {
											record1: {
												"ben/planets.name": "kepler",
											},
											record2: {
												"ben/planets.name": "foobar",
											},
									  }
									: {},
								query: !!requestBody.wires[1].query,
							} as PlainWire,
						],
					})
				)
			return (wire) => {
				expect(spy).toBeCalled()
				const args = spy.mock.calls[0][1]
				expect(args.includeMetadata).toBe(true)
				expect(args.wires.length).toBe(2)
				expect(args.wires[0]).toHaveProperty("name", "galaxy")
				expect(args.wires[0]).toHaveProperty(
					"collection",
					"ben/planets.galaxy"
				)
				expect(args.wires[1]).toHaveProperty("name", wireId)
				expect(args.wires[1]).toHaveProperty("collection", collectionId)
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
