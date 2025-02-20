import { component } from "@uesio/ui"
import { FunctionComponent } from "react"
import { SlotBuilderComponentId } from "../slotbuilder/slotbuilder"
import { InnerViewSlotLoaderId } from "../innerviewslotloader/innerviewslotloader"

export const DeclarativeComponentSlotLoaderId =
  "uesio/builder.declarativecomponentslotloader"

const getSlotProps = (slotProps: component.SlotUtilityProps) =>
  component.getSlotProps(slotProps).map((props) => {
    const { componentType, context } = props

    // If we are rendering an actual Slot component...
    if (componentType === component.SlotComponentId) {
      return {
        ...props,
        context: context.setCustomSlotLoader(SlotBuilderComponentId),
      }
    }
    if (componentType === component.ViewComponentId) {
      return {
        ...props,
        context: context.setCustomSlotLoader(InnerViewSlotLoaderId),
      }
    }
    return props
  })

const DeclarativeComponentSlotLoader: FunctionComponent<
  component.SlotUtilityProps
> = (parentProps) => (
  <>
    {getSlotProps(parentProps).map((props, index) => (
      <component.Component {...props} key={index} />
    ))}
  </>
)

export default DeclarativeComponentSlotLoader
