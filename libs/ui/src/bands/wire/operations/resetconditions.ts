import { Context } from "../../../context/context"
import setConditions from "./setconditions"

export default (context: Context, wireName: string) => {
	//this returns the original wire definition
	const viewDef = context.getViewDef()
	const wireDef = viewDef?.wires?.[wireName]
	if (wireDef && !wireDef.viewOnly && wireDef.conditions) {
		setConditions(context, wireName, wireDef.conditions)
	}
	return context
}
