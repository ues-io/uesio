import { component, definition } from "@uesio/ui"
import { FunctionComponent } from "react"
import { SlotBuilderComponentId } from "../slotbuilder/slotbuilder"
import { getComponentDef } from "../../api/stateapi"

export const DeclarativeComponentSlotLoaderId =
	"uesio/builder.declarativecomponentslotloader"

const getSlotProps = (slotProps: component.SlotUtilityProps) =>
	component.getSlotProps(slotProps).map((props) => {
		const { componentType, context } = props
		const customSlotLoader = context.getCustomSlotLoader()

		// If we are rendering an actual Slot component,
		// we need to make sure that we use the standard builder slot loader.
		if (
			componentType === component.SlotComponentId &&
			customSlotLoader !== SlotBuilderComponentId
		) {
			return {
				...props,
				context: context.setCustomSlotLoader(SlotBuilderComponentId),
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
