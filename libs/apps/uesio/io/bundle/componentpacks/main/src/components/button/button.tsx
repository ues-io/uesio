import { api, styles, component, signal, definition } from "@uesio/ui"
import { default as IOButton } from "../../utilities/button/button"
import Icon from "../../utilities/icon/icon"

type ButtonDefinition = {
	text?: string
	icon?: string
	signals?: signal.SignalDefinition[]
	hotkey?: string
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

	api.signal.useRegisterHotKey(definition.hotkey, definition.signals, context)
	return (
		<IOButton
			id={api.component.getComponentIdFromProps(props)}
			variant={definition["uesio.variant"]}
			classes={classes}
			label={definition.text}
			onClick={api.signal.getHandler(definition.signals, context)}
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

// Old unmigrated definition
/*
defaultDefinition: () => ({
		text: "New Button",
	}),
	properties: [
		{
			name: "text",
			type: "TEXT",
			label: "Text",
		},
		{
			name: "icon",
			type: "ICON",
			label: "Icon",
		},
	],
	sections: [
		{
			title: "Signals",
			type: "SIGNALS",
		},
	],
	actions: [
		{
			label: "Run Signals",
			type: "RUN_SIGNALS",
			slot: "signals",
		},
	],
	traits: ["uesio.standalone"],
	classes: ["root"],
	type: "component",

*/

export default Button
