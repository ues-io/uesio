import { api, styles, component, signal, definition } from "@uesio/ui"
import { useState } from "react"
import {
	ButtonIconPlacement,
	default as IOButton,
} from "../../utilities/button/button"
import Icon from "../../utilities/icon/icon"

type ButtonDefinition = {
	text?: string
	icon?: string
	iconPlacement?: ButtonIconPlacement
	iconFill?: boolean
	signals?: signal.SignalDefinition[]
	hotkey?: string
}

const StyleDefaults = Object.freeze({
	root: [],
	label: [],
	selected: [],
	icon: [],
})

const Button: definition.UC<ButtonDefinition> = (props) => {
	const { definition, context } = props
	const classes = styles.useStyleTokens(StyleDefaults, props)
	const isSelected = component.shouldHaveClass(
		context,
		"selected",
		definition
	)

	const [isPending, setPending] = useState(false)

	const { signals, hotkey, text, icon, iconPlacement, iconFill } = definition

	const [link, handler] = api.signal.useLinkHandler(
		signals,
		context,
		setPending
	)

	api.signal.useRegisterHotKey(hotkey, signals, context)

	return (
		<IOButton
			id={api.component.getComponentIdFromProps(props)}
			variant={definition[component.STYLE_VARIANT]}
			classes={classes}
			disabled={isPending}
			iconPlacement={iconPlacement}
			label={text}
			link={link}
			onClick={handler}
			context={context}
			isSelected={isSelected}
			icon={
				icon ? (
					<Icon
						classes={{
							root: classes.icon,
						}}
						fill={iconFill}
						context={context}
						icon={context.mergeString(icon)}
					/>
				) : undefined
			}
		/>
	)
}

export default Button
