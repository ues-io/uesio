import React, { ReactElement } from "react"
import { hooks, material, component, styles } from "uesio"
import { CardActionProps } from "./cardactiondefinition"
import Icon from "../icon/icon"

const useStyles = material.makeStyles((theme) =>
	material.createStyles({
		root: {
			margin: theme.spacing(1),
		},
	})
)

function CardAction(props: CardActionProps): ReactElement {
	const classes = useStyles(props)
	const uesio = hooks.useUesio(props)
	const definition = props.definition
	const cardProps = {
		className: classes.root,
	}

	const TooltipProps = {
		title: props.definition?.helptext ? props.definition?.helptext : "",
		placement: props.definition?.helptextposition,
	}

	const iconProps = {
		definition: {
			type: props.definition.icon,
			size: props.definition.size,
		},
		path: props.path,
		context: props.context,
	}

	const cardActionProps = {
		onClick:
			props.definition?.signals &&
			uesio.signal.getHandler(props.definition.signals),
	}

	return (
		<material.Tooltip {...TooltipProps}>
			<material.IconButton {...cardActionProps}>
				<Icon {...iconProps}></Icon>
			</material.IconButton>
		</material.Tooltip>
	)
}

export default CardAction
