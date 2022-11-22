import { FunctionComponent } from "react"
import { definition, component } from "@uesio/ui"
import type { Placement } from "@popperjs/core"
import { ButtonUtilityProps } from "../button/button"
import { IconUtilityProps } from "../icon/icon"

interface IconButtonUtilityProps extends definition.UtilityProps {
	onClick?: () => void
	label?: string
	icon?: string
	fill?: boolean
	disabled?: boolean
	tooltipPlacement?: Placement
}

const Icon = component.getUtility<IconUtilityProps>("uesio/io.icon")
const Button = component.getUtility<ButtonUtilityProps>("uesio/io.button")

const IconButton: FunctionComponent<IconButtonUtilityProps> = (props) => {
	const {
		context,
		icon,
		fill,
		label,
		tooltipPlacement,
		onClick,
		disabled,
		variant,
	} = props

	return (
		<Button
			onClick={onClick}
			context={context}
			tooltip={label}
			tooltipPlacement={tooltipPlacement}
			disabled={disabled}
			icon={<Icon context={context} icon={icon} fill={fill} />}
			variant={variant}
		/>
	)
}

export { IconButtonUtilityProps }

export default IconButton
