import { Uesio } from "./hooks"
import { useCollection } from "../bands/collection/selectors"
import { getFullWireId, useWire, useWires } from "../bands/wire/selectors"
import Wire from "../bands/wire/class"
import loadWiresOp from "../bands/wire/operations/load"
import initializeWiresOp from "../bands/wire/operations/initialize"
import { Context } from "../context/context"
import { ViewOnlyField, WireDefinition } from "../definition/wire"
import { useEffect } from "react"
import { ParamDefinitionMap, ParamDefinition } from "../definition/param"
import WireRecord from "../bands/wirerecord/class"
import { ID_FIELD } from "../bands/collection/types"
import { appDispatch } from "../store/store"

const getFieldFromParamDef = (
	key: string,
	def: ParamDefinition
): ViewOnlyField => {
	switch (def.type) {
		case "RECORD":
			return {
				label: key,
				required: !!def.required,
				type: "REFERENCE" as const,
				reference: {
					collection: def.collection,
				},
				placeholder: "Type to Search..",
			}
		default:
			return {
				label: key,
				required: !!def.required,
				type: "TEXT" as const,
				placeholder: "Enter Text",
			}
	}
}

const getValueForParam = (
	key: string,
	def: ParamDefinition,
	record: WireRecord
) => {
	const fieldKey = `uesio/viewonly.${key}`
	switch (def.type) {
		case "RECORD":
			return record.getFieldValue<string>(`${fieldKey}->${ID_FIELD}`)
		default:
			return record.getFieldValue<string>(fieldKey)
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

	useDynamicWire(
		wireName: string,
		wireDef: WireDefinition | null,
		doLoad?: boolean
	) {
		const context = this.uesio.getContext()
		const wire = this.useWire(wireName)
		useEffect(() => {
			if (wire || !wireDef || !wireName) return
			this.initWires(context, {
				[wireName]: wireDef,
			})
			doLoad && this.loadWires(context, [wireName])
		}, [wireName, JSON.stringify(wireDef)])
		return wire
	}

	useWires(wireNames: string[]) {
		const view = this.uesio.getViewId() || ""
		const fullWireIds = wireNames.map((wirename) =>
			getFullWireId(view, wirename)
		)
		const plainWires = useWires(fullWireIds)
		return Object.fromEntries(
			Object.entries(plainWires).map(([key, plainWire]) => {
				const collectionName = plainWire?.collection
				const plainCollection = useCollection(collectionName)
				if (!plainCollection) return [key, undefined]
				return [
					key.slice(view.length + 1),
					new Wire(plainWire).attachCollection(plainCollection),
				]
			})
		)
	}

	loadWires(context: Context, wireNames: string[]) {
		return appDispatch()(
			loadWiresOp({
				context,
				wires: wireNames,
			})
		)
	}

	initWires(context: Context, wireDefs: Record<string, WireDefinition>) {
		return appDispatch()(initializeWiresOp(context, wireDefs))
	}

	getFieldsFromParams(params: ParamDefinitionMap | undefined) {
		if (!params) return {}
		return Object.fromEntries(
			Object.entries(params).map(([key, def]) => [
				`uesio/viewonly.${key}`,
				getFieldFromParamDef(key, def),
			])
		)
	}

	getParamValues(params: ParamDefinitionMap | undefined, record: WireRecord) {
		if (!params) return {}
		return Object.fromEntries(
			Object.entries(params).map(([key, def]) => [
				key,
				getValueForParam(key, def, record),
			])
		)
	}
}

export { WireAPI }
