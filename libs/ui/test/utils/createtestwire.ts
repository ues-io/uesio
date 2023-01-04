// import { WireAPI } from "../../src/hooks/wireapi"
import { useUesio } from "../../src/hooks/hooks"
import { newContext } from "../../src/context/context"
import { selectWire } from "../../src/bands/wire"

import { create } from "../../src/store/store"

import { SignalDefinition } from "../../src/signalexports"
import { WireDefinition } from "../../src/wireexports"
type T = {
	signals: SignalDefinition[]
	wireId: string
	viewId: string
	wireDef: WireDefinition
}
const createTestWire = ({ signals, wireId, viewId, wireDef }: T) => {
	const store = create({})
	const context = newContext({ view: viewId })

	const uesio = useUesio({
		context,
	})

	uesio.wire.initWires(context, {
		[wireId]: wireDef,
	})

	const handler = uesio.signal.getHandler(signals, context)
	handler && handler()

	const myWire = selectWire(store.getState(), viewId, wireId)
	if (!myWire) throw new Error("Wire not created")

	return myWire
}

export { createTestWire }
