import { wire } from "@uesio/ui"
import { getWireDefinition } from "../../api/wireapi"
import {
  PATH_ARROW,
  PropertyTypeHandler,
  getBaseWireFieldDef,
  getObjectProperty,
} from "../handlerutils"
import { getSelectListMetadataFromOptions } from "./select"
import { ConditionProperty } from "../../properties/componentproperty"

const getWireConditionSelectOptions = (wireDef: wire.WireDefinition) => {
  const conditions: wire.SelectOption[] = []

  if (!wireDef || wireDef.viewOnly || !wireDef.conditions) return conditions

  for (const condition of wireDef.conditions) {
    if (!condition) continue

    if (condition?.id) {
      conditions.push({ value: condition.id, label: condition.id })
    }

    if (condition.type === "GROUP" && condition.conditions?.length) {
      for (const subCondition of condition.conditions) {
        if (!subCondition) continue

        if (subCondition?.id) {
          conditions.push({
            value: subCondition.id,
            label: `${condition.id} ${PATH_ARROW} ${subCondition.id}`,
          })
        }
      }
    }
  }
  return conditions
}

const conditionHandler: PropertyTypeHandler = {
  getField: (property: ConditionProperty, context, currentValue) => {
    const wireId = property.wireField
      ? (getObjectProperty(currentValue, property.wireField) as string)
      : property.wire
    const wireDefinition =
      wireId === undefined ? undefined : getWireDefinition(context, wireId)
    return getBaseWireFieldDef(property, `SELECT`, {
      selectlist: getSelectListMetadataFromOptions(
        property.name,
        wireDefinition !== undefined
          ? getWireConditionSelectOptions(wireDefinition)
          : [],
        "",
      ),
    })
  },
}

export { conditionHandler }
