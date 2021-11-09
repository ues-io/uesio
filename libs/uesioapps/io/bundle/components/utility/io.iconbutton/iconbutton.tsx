import { FunctionComponent } from "react"
import { definition, styles, component } from "@uesio/ui"
import type { Placement } from "@popperjs/core"
import { ButtonUtilityProps } from "../io.button/button"
import { IconUtilityProps } from "../io.icon/icon"

interface IconButtonUtilityProps extends definition.UtilityProps {
	onClick?: () => void
	label?: string
	icon?: string
	disabled?: boolean
	tooltipPlacement?: Placement
}

const Icon = component.registry.getUtility<IconUtilityProps>("io.icon")
const Button = component.registry.getUtility<ButtonUtilityProps>("io.button")

const IconButton: FunctionComponent<IconButtonUtilityProps> = (props) => {
	const { context, icon, label, tooltipPlacement, onClick, disabled } = props

	return (
		<Button
			onClick={onClick}
			context={context}
			tooltip={label}
			tooltipPlacement={tooltipPlacement}
			disabled={disabled}
			icon={<Icon context={context} icon={icon} />}
		/>
	)
}

export { IconButtonUtilityProps }

export default IconButton
