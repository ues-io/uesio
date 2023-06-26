import testWireSignal, { WireSignalTest } from "./utils"
import * as platformModule from "../../src/platform/platform"
import { testEnv } from "../utils/defaults"
import { SaveRequestBatch } from "../../src/load/saverequest"
import { Context } from "../../src/context/context"
import { PlainWireRecord } from "../../src/bands/wirerecord/types"

const { viewId, wireId, collectionId, ns } = testEnv

const sampleUUID = "some-nice-uuid"

const simpleSuccessfulSaveMock = (
	context: Context,
	request: SaveRequestBatch
) => {
	const requestChanges = request.wires[0].changes
	const responseChanges = {} as Record<string, PlainWireRecord>
	const changeKeys = Object.keys(requestChanges)
	if (changeKeys.length) {
		changeKeys.forEach((key) => {
			const responseChange = {
				...requestChanges[key],
				...{
					"uesio/core.id": sampleUUID,
				},
			}
			responseChanges[key] = responseChange
		})
	}
	return Promise.resolve({
		wires: [
			{
				wire: request.wires[0].wire,
				changes: responseChanges,
				deletes: request.wires[0].deletes,
				errors: null,
				options: null,
				collection: request.wires[0].collection,
			},
		],
	})
}

const tests: WireSignalTest[] = [
	{
		name: "Save after create record with defaults",
		view: viewId,
		wireId,
		wireDef: {
			collection: `${ns}.${collectionId}`,
			fields: { "ben/planets.name": null },
			defaults: [
				{
					field: "ben/planets.name",
					value: "Neptune",
					valueSource: "VALUE",
				},
			],
		},
		signals: [
			{
				signal: "wire/CREATE_RECORD",
				wire: wireId,
			},
			{
				signal: "wire/SAVE",
				wires: [wireId],
			},
		],
		run: () => {
			const spy = jest
				.spyOn(platformModule.platform, "saveData")
				.mockImplementation(simpleSuccessfulSaveMock)
			return (wire, context) => {
				spy.mockRestore()
				expect(wire.changes).toEqual({})
				const expectedPlainWireRecord = {
					"ben/planets.name": "Neptune",
					"uesio/core.id": sampleUUID,
				}
				expect(Object.values(wire.data)[0]).toEqual(
					expectedPlainWireRecord
				)
				// Verify Redux was updated correctly
				const storeWire = context.getWire(wire.name)
				const storeWireData = storeWire?.getData() || []
				expect(storeWireData).toHaveLength(1)
				expect(storeWireData[0].source).toEqual(expectedPlainWireRecord)
				// Verify that ONLY one wire was updated --- we should have the record added to the context
				expect(context.getRecord(wire.name)?.source).toEqual(
					expectedPlainWireRecord
				)
			}
		},
	},
	{
		name: "Save after create and update record",
		view: viewId,
		wireId,
		wireDef: {
			collection: `${ns}.${collectionId}`,
			fields: { "ben/planets.name": null },
		},
		signals: [
			{
				signal: "wire/CREATE_RECORD",
				wire: wireId,
			},
			{
				signal: "wire/UPDATE_RECORD",
				wire: wireId,
				field: "ben/planets.name",
				value: "Kepler-16b",
			},
			{
				signal: "wire/SAVE",
				wires: [wireId],
			},
		],
		run: () => {
			const spy = jest
				.spyOn(platformModule.platform, "saveData")
				.mockImplementation(simpleSuccessfulSaveMock)
			return (wire, context) => {
				spy.mockRestore()
				expect(wire.changes).toEqual({})
				const expectedPlainWireRecord = {
					"ben/planets.name": "Kepler-16b",
					"uesio/core.id": sampleUUID,
				}
				expect(Object.values(wire.data)[0]).toEqual(
					expectedPlainWireRecord
				)
				// Verify Redux was updated correctly
				const storeWire = context.getWire(wire.name)
				const storeWireData = storeWire?.getData() || []
				expect(storeWireData).toHaveLength(1)
				expect(storeWireData[0].source).toEqual(expectedPlainWireRecord)
				// Verify that ONLY one wire was updated --- we should have the record added to the context
				expect(context.getRecord(wire.name)?.source).toEqual(
					expectedPlainWireRecord
				)
			}
		},
	},
	{
		name: "Save Delete of New Item",
		view: viewId,
		wireId,
		wireDef: {
			collection: `${ns}.${collectionId}`,
			fields: { "ben/planets.name": null },
		},
		signals: [
			{
				signal: "wire/CREATE_RECORD",
				wire: wireId,
			},
			{
				signal: "wire/MARK_FOR_DELETE",
				wire: wireId,
			},
			{
				signal: "wire/SAVE",
				wires: [wireId],
			},
		],
		run: () => {
			const spy = jest
				.spyOn(platformModule.platform, "saveData")
				.mockImplementation(() => Promise.reject({}))
			return (wire) => {
				spy.mockRestore()
				expect(wire.changes).toEqual({})
				expect(wire.data).toEqual({})
			}
		},
	},
	{
		name: "Server Delete",
		view: viewId,
		wireId,
		wireDef: {
			collection: `${ns}.${collectionId}`,
			fields: { "ben/planets.name": null },
		},
		signals: [
			{
				signal: "wire/CREATE_RECORD",
				wire: wireId,
			},
			{
				signal: "wire/UPDATE_RECORD",
				wire: wireId,
				field: "ben/planets.name",
				value: "Kepler-16b",
			},
			{
				signal: "wire/UPDATE_RECORD",
				wire: wireId,
				field: "uesio/core.id",
				value: "a cool uuid",
			},
			{
				signal: "wire/MARK_FOR_DELETE",
				wire: wireId,
			},
			{
				signal: "wire/SAVE",
				wires: [wireId],
			},
		],
		run: () => {
			const spy = jest
				.spyOn(platformModule.platform, "saveData")
				.mockImplementation(simpleSuccessfulSaveMock)
			return (wire) => {
				spy.mockRestore()
				expect(wire.changes).toEqual({})
				expect(wire.data).toEqual({})
			}
		},
	},
	{
		name: "Hybrid Client Server Delete",
		view: viewId,
		wireId,
		wireDef: {
			collection: `${ns}.${collectionId}`,
			fields: { "ben/planets.name": null },
		},
		signals: [
			{
				signal: "wire/CREATE_RECORD",
				wire: wireId,
			},
			{
				signal: "wire/UPDATE_RECORD",
				wire: wireId,
				field: "ben/planets.name",
				value: "Kepler-16b",
			},
			{
				signal: "wire/UPDATE_RECORD",
				wire: wireId,
				field: "uesio/core.id",
				value: "a cool uuid",
			},
			{
				signal: "wire/MARK_FOR_DELETE",
				wire: wireId,
			},
			{
				signal: "wire/CREATE_RECORD",
				wire: wireId,
			},
			{
				signal: "wire/MARK_FOR_DELETE",
				wire: wireId,
			},
			{
				signal: "wire/SAVE",
				wires: [wireId],
			},
		],
		run: () => {
			const spy = jest
				.spyOn(platformModule.platform, "saveData")
				.mockImplementation(simpleSuccessfulSaveMock)
			return (wire) => {
				spy.mockRestore()
				expect(wire.changes).toEqual({})
				expect(wire.data).toEqual({})
			}
		},
	},
	// TODO: write more tests
	// test that the store is invoked with the proper number of wires
	// 1. Deletes
	// 2. Errors
]

describe("Wire Save Tests", () => {
	tests.map((el) => test(el.name, () => testWireSignal(el)))
})
