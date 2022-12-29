import { Uesio } from "./hooks"
import { useCollection, useCollections } from "../bands/collection/selectors"
import { getFullWireId, useWire, useWires } from "../bands/wire"
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

// This is the wire api exposed on the uesio object returned
// to components using the useUesio hook.
class WireAPI {
	constructor(uesio: Uesio) {
		this.uesio = uesio
	}

	uesio: Uesio

	// Wraps our store's useWire result (POJO) in a nice Wire class
	// with convenience methods to make the api easier to consume for end users.
	useWire(wireName?: string) {
		const view = wireName
			? this.uesio.getViewId()
			: this.uesio.getContext().findWireFrame()?.getViewId()
		const name = wireName || this.uesio.getContext().getWireId()
		const plainWire = useWire(view, name)
		const collectionName = plainWire?.collection
		const plainCollection = useCollection(collectionName)
		if (!plainCollection) return undefined
		return new Wire(plainWire).attachCollection(plainCollection)
	}

	useDynamicWire(wireName: string, wireDef: WireDefinition | null) {
		const context = this.uesio.getContext()
		const wire = this.useWire(wireName)
		useEffect(() => {
			if (wire || !wireDef || !wireName) return
			this.initWires(context, {
				[wireName]: wireDef,
			})
			this.loadWires(context, [wireName])
		}, [wireName, JSON.stringify(wireDef)])
		return wire
	}

	useWires(wireNames: string[]): { [k: string]: Wire | undefined } {
		const view = this.uesio.getViewId() || ""
		const fullWireIds = wireNames.map((wirename) =>
			getFullWireId(view, wirename)
		)
		const plainWires = useWires(fullWireIds)
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

	loadWires(context: Context, wireNames: string[]) {
		return loadWiresOp(context, wireNames)
	}

	initWires(context: Context, wireDefs: Record<string, WireDefinition>) {
		return initWiresOp(context, wireDefs)
	}

	getWireFieldsFromParams(params: ParamDefinition[] | undefined) {
		if (!params) return {}
		return Object.fromEntries(
			params.map((def) => [def.name, getWireFieldFromParamDef(def)])
		)
	}

	getParamValues(params: ParamDefinition[] | undefined, record: WireRecord) {
		if (!params) return {}
		return Object.fromEntries(
			params.map((def) => [def.name, getValueForParam(def, record)])
		)
	}
}

export { WireAPI }
