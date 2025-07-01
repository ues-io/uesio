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
    context: slotContext,
  } = props.definition

  if (!definition) return null

  let contextToUse = context

  // If we have a custom slot context in our parent context, we need to transfer it
  if (slotContext) {
    contextToUse = slotContext
    const slotLoader = context.getCustomSlotLoader()
    if (slotLoader) {
      contextToUse = contextToUse.setCustomSlotLoader(slotLoader)
    }
  }

  return (
    <SlotUtility
      definition={definition}
      listName={name}
      readonly={readonly}
      path={path}
      context={contextToUse
        .removeAllComponentFrames(DECLARATIVE_COMPONENT)
        .removeAllPropsFrames()}
      componentType={props.definition.componentType || componentType}
    />
  )
}

Slot.displayName = "Slot"

export { SlotComponentId }

export default Slot
