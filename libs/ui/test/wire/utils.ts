import { newContext, Context } from "../../src/context/context"
import { selectWire } from "../../src/bands/wire"
import { create } from "../../src/store/store"
import { getCollectionSlice } from "../utils/defaults"
import { dispatchRouteDeps } from "../../src/bands/route/utils"
import { SignalDefinition } from "../../src/signalexports"
import * as api from "../../src/api/api"
import { WireDefinition } from "../../src/definition/wire"
import { PlainWire } from "../../src/bands/wire/types"

export type WireSignalTest = {
	name: string
	wireId: string
	wireDef: WireDefinition
	view?: string
	signals?: SignalDefinition[]
	context?: Context
	run: () => (wire: PlainWire, context: Context) => void
}

export const getDefaultContext = (view = "myview") =>
	newContext().addViewFrame({ view, viewDef: view })

export const testWireSignal = async ({
	signals,
	wireId,
	wireDef,
	view = "myview",
	run,
	context = getDefaultContext(view),
}: WireSignalTest) => {
	const store = create({})

	const test = run()

	dispatchRouteDeps({
		collection: getCollectionSlice(),
	})

	api.wire.initWires(context, {
		[wireId]: wireDef,
	})
	const handler = api.signal.getHandler(signals, context)
	if (signals && !handler) throw new Error("No signal handler")
	let resultContext = context
	if (handler) {
		resultContext = await handler()
	}

	const wire = selectWire(store.getState(), view, wireId)

	if (!wire) throw new Error("Wire not created")
	test(wire, resultContext)
}

export const defaultPlainWireProperties = {
	batchid: "",
	batchnumber: 0,
	changes: {},
	deletes: {},
	fields: [],
	original: {},
	viewOnly: false,
	data: {},
}

export default testWireSignal
