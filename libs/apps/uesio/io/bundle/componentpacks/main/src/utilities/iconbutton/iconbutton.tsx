import { FunctionComponent } from "react"
import { definition } from "@uesio/ui"
import { Placement } from "@floating-ui/react"
import Button from "../button/button"
import Icon from "../icon/icon"

interface IconButtonUtilityProps extends definition.UtilityProps {
	onClick?: () => void
	label?: string
	icon?: string
	fill?: boolean
	disabled?: boolean
	tooltipPlacement?: Placement
	tooltipOffset?: number
}

const IconButton: FunctionComponent<IconButtonUtilityProps> = (props) => {
	const {
		context,
		icon,
		fill,
		label,
		tooltipPlacement,
		tooltipOffset,
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
			tooltipOffset={tooltipOffset}
			disabled={disabled}
			icon={<Icon context={context} icon={icon} fill={fill} />}
			variant={variant}
		/>
	)
}

export { IconButtonUtilityProps }

export default IconButton
