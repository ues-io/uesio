import testWireSignal, { WireSignalTest } from "./utils"
import * as platformModule from "../../src/platform/platform"
import { PlainWireRecord } from "../../src/wireexports"
import { getFullWireId } from "../../src/bands/wire"
import { testEnv } from "../utils/defaults"

const { viewId, wireId, collectionId, ns } = testEnv

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
				.mockResolvedValue({ wires: [] } as never)
				.mockImplementation(() =>
					Promise.resolve({
						wires: [
							{
								wire: getFullWireId(viewId, wireId),
								changes: {
									record123: {
										"ben/planets.name": "kepler",
									} as PlainWireRecord,
								} as {
									[key: string]: Record<
										string,
										PlainWireRecord
									>
								},
								deletes: {},
								errors: null,
								options: null,
								collection: `${ns}.${collectionId}`,
							},
						],
					})
				)
			return (wire) => {
				spy.mockRestore()
				expect(wire).toMatchObject({
					changes: {},
				})
				expect(wire.data).toMatchObject({
					record123: {
						"ben/planets.name": "kepler",
					},
				})
			}
		},
	},
	// TODO: write more tests
	// 1. Context handling for single record wires
	// 2. Deletes
	// 3. Errors
]

tests.map((el) => test(el.name, () => testWireSignal(el)))
