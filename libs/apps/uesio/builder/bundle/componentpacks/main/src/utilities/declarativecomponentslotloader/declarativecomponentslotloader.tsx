import { component, definition } from "@uesio/ui"
import { FunctionComponent } from "react"
import { SlotBuilderComponentId } from "../slotbuilder/slotbuilder"
import { getComponentDef } from "../../api/stateapi"

export const DeclarativeComponentSlotLoaderId =
	"uesio/builder.declarativecomponentslotloader"

const getSlotProps = (slotProps: component.SlotUtilityProps) =>
	component.getSlotProps(slotProps).map((props) => {
		const { componentType, context, definition } = props
		const slotName = definition?.name as string
		const customSlotLoader = context.getCustomSlotLoader()

		// If we are rendering an actual Slot component...
		if (
			componentType === component.SlotComponentId &&
			customSlotLoader !== SlotBuilderComponentId
		) {
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
						context: context.setCustomSlotLoader(
							DeclarativeComponentSlotLoaderId
						),
					} as definition.BaseProps
				}
			}
			return {
				...props,
				context: context.setCustomSlotLoader(
					customSlotLoader || SlotBuilderComponentId
				),
			} as definition.BaseProps
		} else {
			// If we are rendering a Declarative Component, we need to set a special slot loader.
			const componentDef = getComponentDef(componentType)
			if (componentDef?.type === component.Declarative) {
				return {
					...props,
					context: context.setCustomSlotLoader(
						DeclarativeComponentSlotLoaderId
					),
				} as definition.BaseProps
			}
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
