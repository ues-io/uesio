import { component, definition } from "@uesio/ui"
import { FunctionComponent } from "react"
import { SlotBuilderComponentId } from "../slotbuilder/slotbuilder"
import { getComponentDef } from "../../api/stateapi"
import { InnerViewSlotLoaderId } from "../innerviewslotloader/innerviewslotloader"

export const DeclarativeComponentSlotLoaderId =
	"uesio/builder.declarativecomponentslotloader"

const getSlotProps = (slotProps: component.SlotUtilityProps) =>
	component.getSlotProps(slotProps).map((props) => {
		const { componentType, context, definition } = props

		// If we encounter a declarative component inside of a declarative component,
		// make it READONLY.
		if (getComponentDef(componentType)?.type === component.Declarative) {
			return {
				...props,
				context: context.setCustomSlotLoader(InnerViewSlotLoaderId),
			} as definition.BaseProps
		}

		// If we are rendering an actual Slot component...
		if (componentType === component.SlotComponentId) {
			const slotName = definition?.name as string
			// If there is NO user-defined content for this slot, but there IS default content,
			// then treat the slot as READONlY, so that no nested slots appear,
			// i.e. it should be rendered exactly like a Declarative Component.
			// Otherwise, use the regular Slot Builder so that the slot area is editable.
			const componentData = context.getComponentData(
				component.DECLARATIVE_COMPONENT
			)?.data as component.DeclarativeComponentSlotContext
			if (componentData) {
				const { slotDefinitions, componentType } = componentData
				const content = slotDefinitions[slotName]
				const defaultContent = getComponentDef(
					componentType
				)?.slots?.find((slot) => slot.name === slotName)?.defaultContent
				if (!content && defaultContent) {
					return {
						...props,
						context: componentData.slotContext,
					} as definition.BaseProps
				}
			}
			return {
				...props,
				context: context.setCustomSlotLoader(SlotBuilderComponentId),
			} as definition.BaseProps
		}
		if (componentType === component.ViewComponentId) {
			return {
				...props,
				context: context.setCustomSlotLoader(InnerViewSlotLoaderId),
			} as definition.BaseProps
		}
		return props as definition.BaseProps
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
