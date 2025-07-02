import { DECLARATIVE_COMPONENT } from "../component/component"
import { Context } from "../context/context"
import { SlotDef } from "../definition/component"
import { DefinitionMap, UC } from "../definition/definition"

import SlotUtility, { DefaultSlotName } from "../utilities/slot"

const SlotComponentId = "uesio/core.slot"

type SlotDefinition = {
  name?: string
  definition?: DefinitionMap
  readonly?: boolean
  path: string
  componentType: string | undefined
  slotDef: SlotDef
  context: Context
}

const Slot: UC<SlotDefinition> = (props) => {
  const {
    // The context coming from the parent of this slot.
    // That is, the context of the component that declared that
    // the slot exists and used the $Slot{myslot} merge.
    context,
    // The componentType of the slot component.
    // (This should always be uesio/core.slot)
    componentType,
  } = props
  const {
    name = DefaultSlotName,
    // The view definition markup of the contents of the slot.
    definition,
    // In build-time this defines whether the contents of this slot
    // can be changed.
    readonly,
    path,
    // The context coming from the view that "used" this slot by giving
    // it a definition for its contents.
    context: slotContext,
    // The definition of the slot as defined by the component that declared it.
    slotDef,
  } = props.definition

  if (!definition) return null

  let contextToUse

  // If the slot has declared that it provides additional context for its contents,
  // then just use the context that it provides.
  if (slotDef.providesContexts) {
    contextToUse = context
  }
  // Otherwise, we should use the context from the component that provided the content.
  else {
    contextToUse = slotContext
    // We still need to keep the custom slot loader from our parent context.
    // So add that to our slotContext if it exists.
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
