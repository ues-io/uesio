import testWireSignal, { WireSignalTest } from "./utils"
import { testEnv } from "../utils/defaults"

const { viewId, wireId, collectionId, ns } = testEnv

const tests: WireSignalTest[] = [
	{
		name: "adding 1 record",
		wireId,
		view: viewId,

		wireDef: { collection: `${ns}.${collectionId}`, fields: {} },
		signals: [
			{
				signal: "wire/CREATE_RECORD",
				wire: wireId,
			},
		],
		run: () => (wire) => expect(Object.keys(wire.data)).toHaveLength(1),
	},
	{
		name: "adding 2 records",
		view: viewId,
		wireId,
		wireDef: { collection: `${ns}.${collectionId}`, fields: {} },
		signals: [
			{
				signal: "wire/CREATE_RECORD",
				wire: wireId,
			},
			{
				signal: "wire/CREATE_RECORD",
				wire: wireId,
			},
		],
		run: () => (wire) => {
			expect(Object.keys(wire.data)).toHaveLength(2)
		},
	},
	{
		name: "appending 1 record",
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
				signal: "wire/CREATE_RECORD",
				wire: wireId,
			},
		],
		run: () => (wire) => {
			const isValid = Object.entries(wire.data).every(([, record], i) => {
				if (i === 1) return Object.keys(record).length === 0
				if (i === 0) return record["ben/planets.name"] === "Kepler-16b"
				return false
			})

			expect(isValid).toBeTruthy()
		},
	},
	{
		name: "prepending 1 record",
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
				signal: "wire/CREATE_RECORD",
				wire: wireId,
				prepend: false,
			},
		],
		run: () => (wire) => {
			const isValid = Object.entries(wire.data).every(([, record], i) => {
				if (i === 0) return record["ben/planets.name"] === "Kepler-16b"
				if (i === 1) return Object.keys(record).length === 0
				return false
			})

			expect(isValid).toBeTruthy()
		},
	},
]

tests.map((el) => test(el.name, () => testWireSignal(el)))
