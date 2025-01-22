import { FunctionComponent } from "react"
import {
  DefinitionList,
  DefinitionMap,
  UtilityProps,
} from "../definition/definition"
import { Component } from "../component/component"
import { MetadataKey } from "../metadata/types"
import { getUtilityLoader } from "../component/registry"
import { definition } from ".."

interface SlotUtilityProps extends UtilityProps {
  path: string
  definition?: DefinitionMap
  listName?: string
  // componentType will be populated if we're coming from a Declarative Component,
  // where we need to be able to lookup the Slot metadata.
  componentType?: MetadataKey
  readonly?: boolean
}

const DefaultSlotName = "components"

const getSlotProps = (props: SlotUtilityProps) => {
  const { path = "", context, listName = DefaultSlotName } = props
  const definition = props.definition
  if (!definition) return []

  const listDef = (definition?.[listName] || []) as DefinitionList
  const listPath = `${path}["${listName}"]`

  return listDef.flatMap((itemDef, index) => {
    if (!itemDef) return []
    const componentType = Object.keys(itemDef)[0]
    const unWrappedDef = itemDef[componentType]
    return {
      definition: unWrappedDef,
      componentType: componentType as MetadataKey,
      path: `${listPath}["${index}"]["${componentType}"]`,
      context,
    } as definition.BaseProps
  })
}

const Slot: FunctionComponent<SlotUtilityProps> = (props) => {
  const slotWrapper = props.context.getCustomSlotLoader()
  if (slotWrapper) {
    const Loader = getUtilityLoader(slotWrapper)
    if (!Loader) throw new Error("Could not load component: " + slotWrapper)
    return <Loader {...props} />
  }

  return (
    <>
      {getSlotProps(props).map((props, index) => (
        <Component key={index} {...props} />
      ))}
    </>
  )
}

Slot.displayName = "Slot"

export type { SlotUtilityProps }
export { getSlotProps, DefaultSlotName }
export default Slot
