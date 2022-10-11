import testWireSignal, { WireSignalTest } from "./utils"
import { testEnv } from "../utils/defaults"

const { viewId, wireId, collectionId, ns } = testEnv

const tests: WireSignalTest[] = [
	{
		name: "Reset",
		view: viewId,

		wireId,
		wireDef: { collection: `${ns}.${collectionId}`, fields: {} },
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
				signal: "wire/MARK_FOR_DELETE",
				wire: wireId,
			},
			{
				signal: "wire/RESET",
				wire: wireId,
			},
		],
		run: () => (wire) => () => {
			expect(wire).toMatchObject({
				data: {},
				changes: {},
				deletes: {},
				errors: {},
			})
		},
	},
	{
		name: "Reset with create on init.",
		view: viewId,

		wireId,
		wireDef: {
			collection: `${ns}.${collectionId}`,
			fields: {},
			init: {
				create: true,
			},
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
				signal: "wire/MARK_FOR_DELETE",
			},
			{
				signal: "wire/RESET",
				wire: wireId,
			},
		],
		run: () => (wire) => {
			expect(wire).toMatchObject({
				deletes: {},
				errors: {},
			})
			expect(Object.keys(wire.changes)).toHaveLength(1)
			expect(Object.keys(wire.data)).toHaveLength(1)
		},
	},
]

tests.map((el) => test(el.name, () => testWireSignal(el)))
