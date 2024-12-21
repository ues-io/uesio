import { FunctionComponent } from "react"
import { useLoadWires } from "../bands/view/operations/load"
import { Context } from "../context/context"
import { ViewDefinition } from "../definition/definition"

type WiresProps = { context: Context; viewDef: ViewDefinition }

const Wires: FunctionComponent<WiresProps> = ({ context, viewDef }) => {
	useLoadWires(context, viewDef)
	return null
}

Wires.displayName = "Wires"

export { type WiresProps }
export default Wires
