import React, { FunctionComponent } from "react"

import { hooks, material, component, styles } from "@uesio/ui"
import { CardProps } from "./carddefinition"

import CardAction from "../cardaction/cardaction"

const useStyles = material.makeStyles((theme) =>
	material.createStyles({
		root: {
			margin: theme.spacing(1),
		},
		media: (props: CardProps) => {
			const color = styles.getColor({
				color: props.definition.media?.background?.color,
				shadePercentage: props.definition?.media?.background?.shade,
				theme,
			})

			return {
				height: props.definition.media?.height,
				...styles.getBackgroundStyles(
					(color && { color: color }) ||
						props.definition.media?.background,
					props.context
				),
			}
		},
		actions: {
			borderTop: "3px ridge",
		},
	})
)

const Card: FunctionComponent<CardProps> = (props) => {
	const classes = useStyles(props)
	const uesio = hooks.useUesio(props)
	const { definition, path, context } = props

	const cardActionAreaClickHandler = () =>
		definition?.signals && uesio.signal.getHandler(definition.signals)

	const cardMedia = <material.CardMedia className={classes.media} />
	const cardContent = (
		<material.CardContent>
			<component.Slot
				definition={definition}
				listName="components"
				path={path}
				accepts={["uesio.standalone", "uesio.field"]}
				context={context}
			/>
		</material.CardContent>
	)
	const cardActionList =
		definition?.actions?.map?.((cardaction, index) => (
			<CardAction
				definition={{
					icon: cardaction.icon,
					size: cardaction.size,
					signals: cardaction.signals,
					helptext: cardaction.helptext,
					helptextposition: cardaction.helptextposition,
				}}
				path={path}
				context={context}
				key={index}
			/>
		)) || null

	//Actions + Signals
	if (definition?.actions && definition?.signals) {
		return (
			<material.Card className={classes.root}>
				<material.CardActionArea onClick={cardActionAreaClickHandler()}>
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
	if (definition?.actions) {
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
	if (definition?.signals) {
		return (
			<material.Card className={classes.root}>
				<material.CardActionArea onClick={cardActionAreaClickHandler()}>
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
