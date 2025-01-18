import { definition } from "@uesio/ui"
import { Placement } from "@floating-ui/react"
import Button from "../button/button"
import Icon from "../icon/icon"

interface IconButtonUtilityProps {
  onClick?: () => void
  label?: string
  icon?: string
  fill?: boolean
  disabled?: boolean
  tooltipPlacement?: Placement
  tooltipOffset?: number
}

const IconButton: definition.UtilityComponent<IconButtonUtilityProps> = (
  props,
) => {
  const {
    context,
    icon,
    fill,
    label,
    tooltipPlacement,
    tooltipOffset,
    onClick,
    className,
    disabled,
    variant,
    id,
  } = props

  return (
    <Button
      id={id}
      className={className}
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

export default IconButton
