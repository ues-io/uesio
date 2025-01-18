import { newContext, Context } from "../../src/context/context"
import { selectWire } from "../../src/bands/wire"
import { InitialState, create } from "../../src/store/store"
import { getCollectionSlice } from "../utils/defaults"
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
  initialState?: InitialState
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
  initialState,
  context = getDefaultContext(view),
}: WireSignalTest) => {
  const store = create(
    initialState ||
      ({
        route: {
          dependencies: {
            collection: getCollectionSlice(),
          },
        },
      } as InitialState),
  )

  const test = run()

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
