import { Context, Mergeable } from "../../../context/context"
import { dispatch } from "../../../store/store"
import { setConditions, getFullWireId } from ".."
import { isValueCondition } from "../conditions/conditions"
import { PlainFieldValue } from "../../wirerecord/types"

export default (context: Context, wireName: string) => {
  //this returns the original wire definition
  const viewDef = context.getViewDef()
  const wireDef = viewDef?.wires?.[wireName]
  if (wireDef && !wireDef.viewOnly && wireDef.conditions) {
    const viewId = context.getViewId()
    const conditions = wireDef.conditions.map((condition) => {
      if (condition.id && isValueCondition(condition)) {
        const { value, values, inactive } = condition
        const newCondition = {
          ...condition,
          inactive: context.mergeBoolean(inactive, false),
        }
        if (value ?? false)
          newCondition.value = context.merge(
            value as Mergeable,
          ) as PlainFieldValue
        if (values ?? false)
          newCondition.values = context.merge(
            values as Mergeable,
          ) as PlainFieldValue[]
        return newCondition
      }
      return condition
    })
    dispatch(
      setConditions({
        entity: getFullWireId(viewId, wireName),
        conditions,
      }),
    )
  }
  return context
}
