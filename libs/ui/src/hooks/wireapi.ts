import { useCollection, useCollections } from "../bands/collection/selectors"
import {
	getFullWireId,
	useWire as uWire,
	useWires as uWires,
} from "../bands/wire"
import Wire from "../bands/wire/class"
import loadWiresOp from "../bands/wire/operations/load"
import initWiresOp from "../bands/wire/operations/initialize"
import { Context } from "../context/context"
import { ViewOnlyField, WireDefinition } from "../definition/wire"
import { useEffect } from "react"
import { ParamDefinition } from "../definition/param"
import WireRecord from "../bands/wirerecord/class"
import { ID_FIELD } from "../bands/collection/types"

const getWireFieldFromParamDef = (def: ParamDefinition): ViewOnlyField => {
	switch (def.type) {
		case "RECORD":
			return {
				label: def.prompt || def.name,
				required: !!def.required,
				type: "REFERENCE" as const,
				reference: {
					collection: def.collection,
				},
			}
		case "METADATAMULTI":
			return {
				label: def.prompt || def.name,
				required: !!def.required,
				type: "LIST" as const,
			}
		default:
			return {
				label: def.prompt || def.name,
				required: !!def.required,
				type: "TEXT" as const,
			}
	}
}

const getValueForParam = (def: ParamDefinition, record: WireRecord) => {
	const fieldKey = def.name
	switch (def.type) {
		case "RECORD":
			return (
				record.getFieldValue<string>(`${fieldKey}->${ID_FIELD}`) || ""
			)
		case "METADATAMULTI": {
			const values = record.getFieldValue<string[]>(fieldKey) || []
			return values.join(",")
		}
		default:
			return record.getFieldValue<string>(fieldKey) || ""
	}
}

// Wraps our store's useWire result (POJO) in a nice Wire class
// with convenience methods to make the api easier to consume for end users.
const useWire = (wireName: string | undefined, context: Context) => {
	const view = wireName
		? context.getViewId()
		: context.findWireFrame()?.getViewId()
	const name = wireName || context.getWireId()
	const plainWire = uWire(view, name)
	const collectionName = plainWire?.collection
	const plainCollection = useCollection(collectionName)
	if (!plainCollection) return undefined
	return new Wire(plainWire).attachCollection(plainCollection)
}

const useDynamicWire = (
	wireName: string,
	wireDef: WireDefinition | null,
	context: Context
) => {
	const wire = useWire(wireName, context)
	useEffect(() => {
		if (!wireDef || !wireName) return
		initWires(context, {
			[wireName]: wireDef,
		})
		loadWires(context, [wireName])
	}, [wireName, JSON.stringify(wireDef)])
	return wire
}

const useWires = (
	wireNames: string[],
	context: Context
): { [k: string]: Wire | undefined } => {
	const view = context.getViewId() || ""
	const fullWireIds = wireNames.map((wirename) =>
		getFullWireId(view, wirename)
	)
	const plainWires = uWires(fullWireIds)
	const collectionNames = Object.values(plainWires).map(
		(plainWire) => plainWire?.collection || ""
	)
	const collections = useCollections(collectionNames)

	return Object.fromEntries(
		Object.entries(plainWires).map(([, plainWire]) => {
			if (!plainWire || !plainWire.collection)
				return [plainWire?.name, undefined]

			const plainCollection = collections[plainWire.collection]
			if (!plainCollection) return [plainWire?.name, undefined]
			return [
				plainWire?.name,
				new Wire(plainWire).attachCollection(plainCollection),
			]
		})
	)
}

const loadWires = loadWiresOp

const initWires = initWiresOp

const getWireFieldsFromParams = (params: ParamDefinition[] | undefined) => {
	if (!params) return {}
	return Object.fromEntries(
		params.map((def) => [def.name, getWireFieldFromParamDef(def)])
	)
}

const getParamValues = (
	params: ParamDefinition[] | undefined,
	record: WireRecord
) => {
	if (!params) return {}
	return Object.fromEntries(
		params.map((def) => [def.name, getValueForParam(def, record)])
	)
}

export {
	useWire,
	useDynamicWire,
	useWires,
	loadWires,
	initWires,
	getWireFieldsFromParams,
	getParamValues,
}
