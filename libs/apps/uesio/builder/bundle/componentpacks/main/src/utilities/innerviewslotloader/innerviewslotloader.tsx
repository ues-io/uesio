import { component } from "@uesio/ui"
import { FunctionComponent } from "react"

export const InnerViewSlotLoaderId = "uesio/builder.innerviewslotloader"

const InnerViewSlotLoader: FunctionComponent<component.SlotUtilityProps> = (
	props
) => (
	<>
		{component.getSlotProps(props).map((props, index) => (
			<component.Component key={index} {...props} />
		))}
	</>
)

export default InnerViewSlotLoader
