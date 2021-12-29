import { FunctionComponent } from "react"
import { hooks, styles, component } from "@uesio/ui"
import { ButtonProps } from "./buttondefinition"
import { IconUtilityProps } from "../../utility/io.icon/icon"
import { ButtonUtilityProps } from "../../utility/io.button/button"

const IOButton = component.registry.getUtility<ButtonUtilityProps>("io.button")
const Icon = component.registry.getUtility<IconUtilityProps>("io.icon")

const Button: FunctionComponent<ButtonProps> = (props) => {
	const { definition, context } = props
	const uesio = hooks.useUesio(props)
	const classes = styles.useStyles(
		{
			root: {},
			label: {},
			selected: {},
		},
		props
	)
	const isSelected = component.shouldHaveClass(
		context,
		"selected",
		definition
	)
	const [handler, portals] = uesio.signal.useHandler(definition.signals)
	return (
		<>
			<IOButton
				variant={definition["uesio.variant"]}
				classes={classes}
				label={definition.text}
				onClick={handler}
				context={context}
				isSelected={isSelected}
				icon={
					definition.icon ? (
						<Icon
							styles={definition["uesio.styles"]?.icon || {}}
							context={context}
							icon={definition.icon}
						/>
					) : undefined
				}
			/>
			{portals}
		</>
	)
}

export default Button
