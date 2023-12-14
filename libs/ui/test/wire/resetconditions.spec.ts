import testWireSignal, { WireSignalTest } from "./utils"
import { ValueConditionState, WireDefinition } from "../../src/wireexports"
import { Context } from "../../src/context/context"
import { getCollectionSlice } from "../utils/defaults"
import { InitialState } from "../../src/store/store"
import { PlainViewDef } from "../../src/definition/view"

const wireId = "mywire"
const collectionId = "ben/planets.exoplanet"

const getInitialState = (wireDef: WireDefinition) =>
	({
		route: {
			dependencies: {
				collection: getCollectionSlice(),
				viewdef: [
					{
						definition: {
							wires: {
								[wireId]: wireDef,
							},
							components: [],
						},
						name: "myview",
					} as PlainViewDef,
				],
			},
		},
	} as InitialState)

const wireDef1 = {
	collection: collectionId,
	fields: {},
	conditions: [
		{
			id: "123",
			field: "ben/planets.name",
			valueSource: "VALUE",
			value: "kepler",
			inactive: true,
		},
		{
			id: "456",
			field: "ben/planets.galaxy",
			valueSource: "VALUE",
			values: [1, 2],
			inactive: false,
		},
		{
			field: "uesio/core.id",
			valueSource: "VALUE",
			operator: "IN",
			values: ["abc", "defg"],
			inactive: false,
		},
	] as ValueConditionState[],
}

const wireDef2 = {
	collection: collectionId,
	conditions: [
		{
			id: "999",
			field: "ben/planets.name",
			valueSource: "VALUE",
			value: "$Param{first} $Param{last}",
			inactive: true,
		} as ValueConditionState,
	],
	fields: {},
}

const tests: WireSignalTest[] = [
	{
		name: "it should reset named conditions with static values, but ignore unnamed conditions",
		initialState: getInitialState(wireDef1),
		wireId,
		wireDef: wireDef1,
		signals: [
			// First modify the condition values
			{
				signal: "wire/SET_CONDITION_VALUE",
				wire: wireId,
				conditionId: "123",
				value: "Foobar",
			},
			{
				signal: "wire/SET_CONDITION_VALUE",
				wire: wireId,
				conditionId: "456",
				values: [3],
			},
			// Then reset them
			{
				signal: "wire/RESET_CONDITIONS",
				wire: wireId,
			},
		],
		run: () => (wire) => () => {
			expect(wire).toMatchObject({
				conditions: [
					{
						id: "123",
						field: "ben/planets.name",
						value: "kepler",
						inactive: true,
					},
					{
						id: "456",
						field: "ben/planets.galaxy",
						values: [1, 2],
						inactive: false,
					},
					{
						field: "uesio/core.id",
						operator: "IN",
						values: ["abc", "defg"],
						inactive: false,
					},
				],
			})
		},
	},
	{
		name: "should evaluate merges when resetting condition values",
		initialState: getInitialState(wireDef2),
		wireId,
		wireDef: wireDef2,
		context: new Context()
			.addViewFrame({
				view: "myview",
				viewDef: "myview",
				params: {
					first: "Luigi",
					last: "Vampa",
				},
			})
			.addSignalOutputFrame("ageCalculation", {
				age: 37,
				conditionName: "999",
				wirename: wireId,
			}),
		signals: [
			{
				signal: "wire/SET_CONDITION_VALUE",
				wire: "$SignalOutput{ageCalculation:wirename}",
				conditionId: "$SignalOutput{ageCalculation:conditionName}",
				value: "Alice Perkins (Age: $SignalOutput{ageCalculation:age})",
			},
			{
				signal: "wire/RESET_CONDITIONS",
				wire: "$SignalOutput{ageCalculation:wirename}",
			},
		],
		run: () => (wire) => {
			expect(wire.conditions).toEqual([
				{
					id: "999",
					field: "ben/planets.name",
					valueSource: "VALUE",
					value: "Luigi Vampa",
					inactive: true,
				},
			])
		},
	},
]

describe("signals: wire/RESET_CONDITIONS", () => {
	tests.map((el) => test(el.name, () => testWireSignal(el)))
})
