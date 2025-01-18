import { DECLARATIVE_COMPONENT } from "../component/component"
import { Context } from "../context/context"
import { DefinitionMap, UC } from "../definition/definition"

import SlotUtility, { DefaultSlotName } from "../utilities/slot"

const SlotComponentId = "uesio/core.slot"

type SlotDefinition = {
  name?: string
  definition?: DefinitionMap
  readonly?: boolean
  path: string
  componentType: string | undefined
  context: Context
}

const Slot: UC<SlotDefinition> = (props) => {
  const { context, componentType } = props
  const {
    name = DefaultSlotName,
    definition,
    readonly,
    path,
  } = props.definition

  if (!definition) return null
  const slotContext = props.definition.context || context
  return (
    <SlotUtility
      definition={definition}
      listName={name}
      readonly={readonly}
      path={path}
      context={slotContext.removeAllComponentFrames(DECLARATIVE_COMPONENT)}
      componentType={props.definition.componentType || componentType}
    />
  )
}

Slot.displayName = "Slot"

export { SlotComponentId }

export default Slot
