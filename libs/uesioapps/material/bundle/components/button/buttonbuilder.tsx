import React, { ReactElement, memo } from "react"
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

const ButtonBuilder = memo(
	(props: ButtonProps): ReactElement => {
		const classes = useStyles()
		const uesio = hooks.useUesio(props)
		const definition = uesio.view.useDefinition(
			props.path
		) as ButtonDefinition

		return (
			<div className={classes.root}>
				<Button {...props} definition={definition}></Button>
				<ComponentMask></ComponentMask>
			</div>
		)
	},
	(oldProps, newProps) => {
		const sameDefinition = oldProps.definition === newProps.definition
		const sameIndex = oldProps.index === newProps.index
		const samePath = oldProps.path === newProps.path
		return sameDefinition && sameIndex && samePath
	}
)

ButtonBuilder.displayName = "ButtonBuilder"

export default ButtonBuilder
