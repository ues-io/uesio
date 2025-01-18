import { FunctionComponent } from "react"
import { useLoadWiresAndEvents } from "../bands/view/operations/load"
import { Context } from "../context/context"
import { ViewDefinition } from "../definition/definition"

type WiresAndEventsProps = { context: Context; viewDef: ViewDefinition }

const WiresAndEvents: FunctionComponent<WiresAndEventsProps> = ({
  context,
  viewDef,
}) => {
  useLoadWiresAndEvents(context, viewDef)
  return null
}

WiresAndEvents.displayName = "WiresAndEvents"

export { type WiresAndEventsProps }
export default WiresAndEvents
