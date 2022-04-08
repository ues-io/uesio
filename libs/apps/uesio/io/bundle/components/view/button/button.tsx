import { FunctionComponent } from "react"
import { hooks, styles, component } from "@uesio/ui"
import { ButtonProps } from "./buttondefinition"
import { IconUtilityProps } from "../../utility/icon/icon"
import { ButtonUtilityProps } from "../../utility/button/button"

const IOButton =
	component.registry.getUtility<ButtonUtilityProps>("uesio/io.button")
const Icon = component.registry.getUtility<IconUtilityProps>("uesio/io.icon")

const Button: FunctionComponent<ButtonProps> = (props) => {
	const { definition, context } = props
	const uesio = hooks.useUesio(props)
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
							classes={{
								root: classes.icon,
							}}
							context={context}
							icon={context.merge(definition.icon)}
						/>
					) : undefined
				}
			/>
			{portals}
		</>
	)
}

export default Button
