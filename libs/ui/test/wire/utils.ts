import { useUesio } from "../../src/hooks/hooks"
import { newContext, Context } from "../../src/context/context"
import { selectWire } from "../../src/bands/wire"
import { platform } from "../../src/platform/platform"
import { create } from "../../src/store/store"
import { storeCollection, testEnv } from "../utils/defaults"
import { dispatchRouteDeps } from "../../src/bands/route/utils"
import { SignalDefinition } from "../../src/signalexports"
import { WireDefinition, PlainWire } from "../../src/wireexports"

export type WireSignalTest = {
	name: string
	wireId: string
	wireDef: WireDefinition
	view: string
	signals?: SignalDefinition[]
	run: () => (wire: PlainWire, context: Context) => void
}

export const testWireSignal = async ({
	signals,
	wireId,
	wireDef,
	view,
	run,
}: WireSignalTest) => {
	const store = create(platform, {})

	const context = newContext({ view })
	const uesio = useUesio({
		context,
	})
	const test = run()

	dispatchRouteDeps(
		{
			collection: {
				ids: [`ben/planets.${testEnv.collectionId}`],
				entities: {
					[`ben/planets.${testEnv.collectionId}`]: {
						...storeCollection,
					},
				},
			},
		},
		store.dispatch
	)

	uesio.collection.uesio.wire.initWires(context, {
		[wireId]: wireDef,
	})
	const handler = uesio.signal.getHandler(signals, context)
	if (signals && !handler) throw new Error("No signal handler")
	if (handler) await handler()

	const wire = selectWire(store.getState(), view, wireId)

	if (!wire) throw new Error("Wire not created")
	test(wire, context)
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

// export const defaultCollectionResponse = {
// 	name: "name",
// 	namespace: "ben/planets",
// 	createable: true,
// 	accessible: true,
// 	updateable: true,
// 	deleteable: false,
// 	nameField: "ben/planets.name",
// 	fields: {
// 		"ben/planets.name": {
// 			name: "name",
// 			namespace: "ben/planets",
// 			createable: true,
// 			accessible: true,
// 			updateable: true,
// 			type: "TEXT",
// 			label: "Name",
// 		},
// 	},
// }

// export const defaultFieldMetadata: FieldMetadata = {
// 	name: "name",
// 	namespace: "ben/planets",
// 	createable: true,
// 	accessible: true,
// 	updateable: true,
// 	type: "TEXT",
// 	label: "Name",
// }

export default testWireSignal
