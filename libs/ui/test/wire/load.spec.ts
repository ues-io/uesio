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
import { ValueConditionState } from "../../src/bands/wire/conditions/conditions"

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
		name: "Load request should include view only field metadata when necessary for server-side processing",
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
				// View only field
				viewOnlySelect: {
					viewOnly: true,
					type: "SELECT",
					label: "View Only select",
					selectlist: {
						name: "luigi/foo.somelist",
					},
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
					expect(fields).toHaveLength(3)
					expect(fields[0]).toEqual({
						id: "name",
					})
					expect(fields[1]).toEqual({
						id: "viewOnly",
					})
					expect(fields[2]).toEqual({
						id: "viewOnlySelect",
						viewOnlyMetadata: {
							type: "SELECT",
							selectlist: {
								name: "luigi/foo.somelist",
							},
						},
					})
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
		name: "Load request should strip inactive conditions",
		wireId,
		wireDef: {
			collection: collectionId,
			conditions: [
				{
					field: "ben/planets.name",
					operator: "EQ",
					valueSource: "VALUE",
					value: "",
					id: "planetName",
					inactive: true,
				},
				{
					field: "ben/planets.solarsystem",
					operator: "EQ",
					valueSource: "VALUE",
					value: "Our solar system",
					id: "solarSystem",
					inactive: false,
				},
			],
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
					const { conditions } = loadWire
					// only the active conditions should have been sent to server
					expect(conditions?.length).toBe(1)
					expect(conditions?.[0].id).toBe("solarSystem")
					expect((conditions?.[0] as ValueConditionState).value).toBe(
						"Our solar system"
					)
				})
				spy.mockRestore()
				expect(wire.data).toEqual({
					record1: { "ben/planets.name": "kepler" },
					record2: { "ben/planets.name": "foobar" },
				})
				// verify that all original conditions are in the rehydrated wire
				expect(wire.conditions).toEqual([
					{
						field: "ben/planets.name",
						operator: "EQ",
						valueSource: "VALUE",
						value: "",
						id: "planetName",
						inactive: true,
					},
					{
						field: "ben/planets.solarsystem",
						operator: "EQ",
						valueSource: "VALUE",
						value: "Our solar system",
						id: "solarSystem",
						inactive: false,
					},
				])
			}
		},
	},
]

describe("Wire Load", () => {
	tests.map((el) => test(el.name, () => testWireSignal(el)))
})
