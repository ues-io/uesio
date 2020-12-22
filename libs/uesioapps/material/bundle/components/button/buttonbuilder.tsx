import { FunctionComponent, memo } from "react"
import { ButtonProps, ButtonDefinition } from "./buttondefinition"
import Button from "./button"
import ComponentMask from "./componentmask"
import { hooks, material } from "@uesio/ui"

const useStyles = material.makeStyles(() =>
	material.createStyles({
		root: {
			position: "relative",
		},
	})
)

const ButtonBuilder: FunctionComponent<ButtonProps> = (props) => {
	const classes = useStyles()
	const uesio = hooks.useUesio(props)
	const definition = uesio.view.useDefinition(props.path) as ButtonDefinition

	return (
		<div className={classes.root}>
			<Button {...props} definition={definition} />
			<ComponentMask />
		</div>
	)
}

ButtonBuilder.displayName = "ButtonBuilder"

export default memo(ButtonBuilder, (oldProps, newProps) => {
	const sameDefinition = oldProps.definition === newProps.definition
	const sameIndex = oldProps.index === newProps.index
	const samePath = oldProps.path === newProps.path
	return sameDefinition && sameIndex && samePath
})
