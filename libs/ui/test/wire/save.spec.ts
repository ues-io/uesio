import testWireSignal, { WireSignalTest } from "./utils"
import * as platformModule from "../../src/platform/platform"
import { testEnv } from "../utils/defaults"
import { SaveRequestBatch } from "../../src/load/saverequest"
import { Context } from "../../src/context/context"

const { viewId, wireId, collectionId, ns } = testEnv

const simpleSuccessfulSaveMock = (
	context: Context,
	request: SaveRequestBatch
) =>
	Promise.resolve({
		wires: [
			{
				wire: request.wires[0].wire,
				changes: request.wires[0].changes,
				deletes: request.wires[0].deletes,
				errors: null,
				options: null,
				collection: request.wires[0].collection,
			},
		],
	})

const tests: WireSignalTest[] = [
	{
		name: "Save",
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
			return (wire) => {
				spy.mockRestore()
				expect(wire.changes).toEqual({})
				expect(Object.values(wire.data)[0]).toEqual({
					"ben/planets.name": "Kepler-16b",
				})
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
	// 1. Context handling for single record wires
	// 2. Deletes
	// 3. Errors
]

tests.map((el) => test(el.name, () => testWireSignal(el)))
