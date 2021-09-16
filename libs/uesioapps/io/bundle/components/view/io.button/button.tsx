import { FunctionComponent } from "react"
import { hooks, styles, component } from "@uesio/ui"
import { ButtonProps } from "./buttondefinition"

const IOButton = component.registry.getUtility("io.button")
const Icon = component.registry.getUtility("io.icon")

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
				classes={classes}
				label={definition.text}
				onClick={handler}
				context={context}
				isSelected={isSelected}
				icon={
					<Icon
						context={context}
						icon={definition.icon}
						variant="studio.buttonicon"
					/>
				}
			/>
			{portals}
		</>
	)
}

export default Button
