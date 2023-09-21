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

	let { signals } = definition

	// If we have a custom slot context, don't run signals.
	// TODO: Move this out of runtime, and add a way TO run the signals via a Keyboard Shortcut
	// or via a property on the button Definition.
	const slotWrapper = context.getCustomSlotLoader()
	if (slotWrapper) {
		signals = []
	}

	const [link, handler] = api.signal.useLinkHandler(
		signals,
		context,
		setPending
	)

	api.signal.useRegisterHotKey(definition.hotkey, signals, context)

	return (
		<IOButton
			id={api.component.getComponentIdFromProps(props)}
			variant={definition[component.STYLE_VARIANT]}
			classes={classes}
			disabled={isPending}
			iconPlacement={definition.iconPlacement}
			label={definition.text}
			link={link}
			onClick={handler}
			context={context}
			isSelected={isSelected}
			icon={
				definition.icon ? (
					<Icon
						classes={{
							root: classes.icon,
						}}
						context={context}
						icon={context.mergeString(definition.icon)}
					/>
				) : undefined
			}
		/>
	)
}

export default Button
