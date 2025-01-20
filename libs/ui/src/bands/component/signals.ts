import { getSignal } from "../../component/registry"
import { Context, isContextObject } from "../../context/context"
import { SignalDefinition } from "../../definition/signal"
import { getCurrentState, dispatch } from "../../store/store"
import { selectTarget } from "./selectors"
import { set as setComponent } from "../component"
import { platform } from "../../platform/platform"
import { makeComponentId } from "../../hooks/componentapi"
import { produce } from "immer"

interface ComponentSignal extends SignalDefinition {
  component: string
  componentsignal: string
  targettype: "specific" | "multiple"
  target?: string
  componentid?: string
}

const getComponentSignalDefinition = () => ({
  dispatcher: async (signal: ComponentSignal, context: Context) => {
    const {
      target: signalTarget,
      signal: signalName,
      componentid,
      targettype,
    } = signal
    const [band, ...rest] = signalName.split("/")

    if (band !== "component") return context

    let componentSignal = ""
    let componentType = ""

    // New syntax - signal specified via separate properties, e.g.
    // { signal: "component/CALL", component: "uesio/io.list", componentsignal: "TOGGLE_MODE" }
    if (rest.length === 1 && rest[0] === "CALL") {
      componentType = signal.component
      componentSignal = signal.componentsignal
    } else if (rest.length === 3) {
      // Old syntax - component type and component-specific signal embedded in the signal name,
      // e.g. { signal: "component/uesio/io.list/TOGGLE_MODE" }
      componentType = `${rest[0]}/${rest[1]}`
      componentSignal = rest[2]
    }

    if (!componentType) {
      throw new Error("No component type selected for component signal")
    }
    if (!componentSignal) {
      throw new Error("No component signal selected")
    }

    const handler = getSignal(componentType, componentSignal)
    if (!handler) {
      throw new Error(
        `Missing handler for component signal. "${componentType}" has no signal "${componentSignal}"`,
      )
    }

    const target =
      (targettype === "specific"
        ? componentid
        : signalTarget || handler.target) || ""
    const state = getCurrentState()

    // This is where we select state based on even partial target ids
    const targetSearch = makeComponentId(context, componentType, target)

    let componentStates = selectTarget(state, targetSearch)

    // If we couldn't find targets in our record context, try without it.
    if (!componentStates.length) {
      const targetSearch = makeComponentId(context, componentType, target, true)
      componentStates = selectTarget(state, targetSearch)

      // If we still can't find a target, we'll need to create entirely new state
      if (!componentStates.length) {
        componentStates = [{ id: targetSearch, state: {} }]
      }
    }

    const setContext = (newContext: Context) => {
      context = newContext
    }

    // This function runs the dispatcher provided on the component signal
    // handler. There are a few different scenarios depending on what is
    // returned from the dispatcher.
    // 1. If the value returned from the dispatcher is a Context object,
    // we set our signal context to that context.
    // 2. If the value returned from the dispatcher is a Promise, await
    // the promise.
    // 3. If the value returned from the dispatcher is anything else, use
    // the normal immer "produce" functionality.
    const runComponentDispatcher =
      (
        componentId: string,
        setContext: (context: Context) => void,
        setPromise: (promise: Promise<Context>) => void,
      ) =>
      (draft: unknown) => {
        const returnvalue = handler.dispatcher(
          draft,
          signal,
          context,
          platform,
          componentId,
        )
        // If we returned a context object from our dispatcher,
        // That means we want to set it as the new context.
        if (isContextObject(returnvalue)) {
          setContext(returnvalue)
          return
        }
        if (returnvalue instanceof Promise) {
          setPromise(returnvalue)
          return
        }
        return returnvalue
      }

    // Loop over all ids that match the target and dispatch
    // to them all
    for (const componentState of componentStates) {
      let returnValuePromise: Promise<Context> | undefined = undefined
      dispatch(
        setComponent({
          id: componentState.id,
          state: produce(
            componentState.state,
            runComponentDispatcher(componentState.id, setContext, (promise) => {
              returnValuePromise = promise
            }),
          ),
        }),
      )
      // Usually the value returned from the dispatcher isn't a promise, but in case it is, we should
      // wait for it to resolve here.
      if (returnValuePromise) {
        await Promise.resolve(returnValuePromise)
      }
    }

    return context
  },
})

export { getComponentSignalDefinition }
