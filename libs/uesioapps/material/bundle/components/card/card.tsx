import React, { FunctionComponent } from "react"

import { hooks, material, component, styles } from "@uesio/ui"
import { CardProps } from "./carddefinition"

import CardAction from "../cardaction/cardaction"
import { CardActionProps } from "../cardaction/cardactiondefinition"

const useStyles = material.makeStyles((theme) =>
	material.createStyles({
		root: {
			margin: theme.spacing(1),
		},
		media: (props: CardProps) => ({
			height: props.definition.media?.height,
			...styles.getBackgroundStyles(
				props.definition.media?.background,
				props.context
			),
		}),
		actions: {
			borderTop: "3px ridge",
		},
	})
)

const Card: FunctionComponent<CardProps> = (props) => {
	const classes = useStyles(props)
	const uesio = hooks.useUesio(props)
	const definition = props.definition

	const slotProps = {
		definition,
		listName: "components",
		path: props.path,
		accepts: ["uesio.standalone"],
		context: props.context,
	}

	const cardActionAreaProps = {
		onClick:
			props.definition?.signals &&
			uesio.signal.getHandler(props.definition.signals),
	}

	const cardMedia = <material.CardMedia className={classes.media} />
	const cardContent = (
		<material.CardContent>
			<component.Slot {...slotProps}></component.Slot>
		</material.CardContent>
	)

	var cardActionList = new Array()
	if (props.definition?.actions) {
		for (let cardaction of props.definition?.actions) {
			const cardActionProps: CardActionProps = {
				definition: {
					icon: cardaction.icon,
					size: cardaction.size,
					signals: cardaction.signals,
					helptext: cardaction.helptext,
					helptextposition: cardaction.helptextposition,
				},
				path: props.path,
				context: props.context,
			}

			cardActionList.push(<CardAction {...cardActionProps}></CardAction>)
		}
	}

	//Actions + Signals
	if (props.definition?.actions && props.definition?.signals) {
		return (
			<material.Card className={classes.root}>
				<material.CardActionArea {...cardActionAreaProps}>
					{cardMedia}
					{cardContent}
				</material.CardActionArea>
				<material.CardActions className={classes.actions}>
					{cardActionList}
				</material.CardActions>
			</material.Card>
		)
	}
	//Just Actions
	if (props.definition?.actions) {
		return (
			<material.Card className={classes.root}>
				{cardMedia}
				{cardContent}
				<material.CardActions className={classes.actions}>
					{cardActionList}
				</material.CardActions>
			</material.Card>
		)
	}
	//Just Signals
	if (props.definition?.signals) {
		return (
			<material.Card className={classes.root}>
				<material.CardActionArea {...cardActionAreaProps}>
					{cardMedia}
					{cardContent}
				</material.CardActionArea>
			</material.Card>
		)
	}

	//Non
	return (
		<material.Card className={classes.root}>
			{cardMedia}
			{cardContent}
		</material.Card>
	)
}

export default Card
