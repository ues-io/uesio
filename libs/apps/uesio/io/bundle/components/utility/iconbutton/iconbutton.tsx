import { FunctionComponent } from "react"
import { definition, component } from "@uesio/ui"
import type { Placement } from "@popperjs/core"
import { ButtonUtilityProps } from "../button/button"
import { IconUtilityProps } from "../icon/icon"

interface IconButtonUtilityProps extends definition.UtilityProps {
	onClick?: () => void
	label?: string
	icon?: string
	disabled?: boolean
	tooltipPlacement?: Placement
}

const Icon = component.getUtility<IconUtilityProps>("uesio/io.icon")
const Button = component.getUtility<ButtonUtilityProps>("uesio/io.button")

const IconButton: FunctionComponent<IconButtonUtilityProps> = (props) => {
	const {
		context,
		icon,
		label,
		tooltipPlacement,
		onClick,
		disabled,
		variant,
	} = props

	return (
		<Button
			className={props.className}
			onClick={onClick}
			context={context}
			tooltip={label}
			tooltipPlacement={tooltipPlacement}
			disabled={disabled}
			icon={<Icon context={context} icon={icon} />}
			variant={variant}
		/>
	)
}

export { IconButtonUtilityProps }

export default IconButton
