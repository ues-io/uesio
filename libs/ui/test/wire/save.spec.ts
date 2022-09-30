import testWireSignal, { WireSignalTest } from "./utils"
import * as platformModule from "../../src/platform/platform"
import { PlainWireRecord } from "../..//src/wireexports"
const WIRE_NAME = "exoplanets"
const VIEW_NAME = "allPlanets"
const NS = "ben/planets"
const tests: WireSignalTest[] = [
	{
		name: "Save",
		wireId: WIRE_NAME,
		wireDef: {
			collection: "ben/planets.exoplanets",
			fields: { "ben/planets.name": null },
		},
		signals: [
			{
				signal: "wire/CREATE_RECORD",
				wire: WIRE_NAME,
			},
			{
				signal: "wire/UPDATE_RECORD",
				wire: WIRE_NAME,
				field: "ben/planets.name",
				value: "Kepler-16b",
			},
			{
				signal: "wire/SAVE",
				wires: [WIRE_NAME],
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
								wire: `${NS}.${VIEW_NAME}():${WIRE_NAME}`,
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
								collection: `${NS}.exoplanets`,
							},
						],
					})
				)
			return (wire) => {
				spy.mockRestore()
				expect(wire).toMatchObject({
					changes: {},
				})
				expect(wire.data).toEqual({
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
