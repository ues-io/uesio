import { api, styles, component, signal, definition } from "@uesio/ui"
import { default as IOButton } from "../../utilities/button/button"
import Icon from "../../utilities/icon/icon"
import { disable, enable } from "../../shared/disabled"

type ButtonDefinition = {
	text?: string
	icon?: string
	signals?: signal.SignalDefinition[]
	hotkey?: string
	disabled?: boolean
}

const signals: Record<string, signal.ComponentSignalDescriptor> = {
	ENABLE: enable,
	DISABLE: disable,
}

const Button: definition.UC<ButtonDefinition> = (props) => {
	const { definition, context } = props
	const classes = styles.useStyles(
		{
			root: {},
			label: {},
			selected: {},
			icon: {},
		},
		props
	)
	const isSelected = component.shouldHaveClass(
		context,
		"selected",
		definition
	)

	const [link, handler] = api.signal.getLinkHandler(
		definition.signals,
		context
	)

	api.signal.useRegisterHotKey(definition.hotkey, definition.signals, context)

	const componentId = api.component.getComponentIdFromProps(props)
	const [disabled] = api.component.useDisabled(
		componentId,
		definition.disabled
	)

	return (
		<IOButton
			id={api.component.getComponentIdFromProps(props)}
			variant={definition["uesio.variant"]}
			classes={classes}
			label={definition.text}
			link={link}
			disabled={disabled}
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

Button.signals = signals
export default Button
