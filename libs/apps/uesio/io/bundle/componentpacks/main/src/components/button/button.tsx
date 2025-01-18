import { api, component, signal, definition } from "@uesio/ui"
import { useState } from "react"
import {
  ButtonIconPlacement,
  default as IOButton,
} from "../../utilities/button/button"

type ButtonDefinition = {
  text?: string
  icon?: string
  iconPlacement?: ButtonIconPlacement
  iconFill?: boolean
  pendingText?: string
  signals?: signal.SignalDefinition[]
  hotkey?: string
  tooltip?: string
}

const Button: definition.UC<ButtonDefinition> = (props) => {
  const { definition, context } = props
  const isSelected = component.shouldHaveClass(context, "selected", definition)

  const [isPending, setPending] = useState(false)

  const {
    signals,
    hotkey,
    text,
    icon,
    iconPlacement,
    iconFill,
    tooltip,
    pendingText,
  } = definition

  const [link, handler] = api.signal.useLinkHandler(
    signals,
    context,
    setPending,
  )

  api.signal.useRegisterHotKey(hotkey, signals, context)

  return (
    <IOButton
      id={api.component.getComponentIdFromProps(props)}
      variant={definition[component.STYLE_VARIANT]}
      styleTokens={definition[component.STYLE_TOKENS]}
      isPending={isPending}
      pendingLabel={pendingText}
      iconPlacement={iconPlacement}
      iconFill={iconFill}
      label={text}
      link={link}
      onClick={handler}
      context={context}
      tooltip={tooltip}
      isSelected={isSelected}
      iconText={icon}
    />
  )
}

export default Button
