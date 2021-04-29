import { FunctionComponent } from "react"

import { component, styles, hooks } from "@uesio/ui"
import { TileProps } from "./tiledefinition"

const Tile: FunctionComponent<TileProps> = (props) => {
	const classes = styles.useStyles(
		{
			root: {
				display: "flex",
				...(props.definition.signals && {
					cursor: "pointer",
				}),
				"&:hover": {
					backdropFilter: "brightness(97%)",
				},
			},
			content: {
				flex: 1,
			},
			avatar: {
				marginRight: "8px",
			},
			selected: {},
		},
		props
	)
	const uesio = hooks.useUesio(props)
	const { definition, context, path } = props
	const [handler, portals] = uesio.signal.useHandler(definition.signals)
	const isSelected = component.shouldHaveClass(
		context,
		"selected",
		definition
	)
	return (
		<div
			className={styles.cx(classes.root, isSelected && classes.selected)}
			onClick={handler}
		>
			{definition.avatar && (
				<div className={classes.avatar}>
					<component.Slot
						definition={definition}
						listName="avatar"
						path={path}
						accepts={["uesio.standalone"]}
						context={context}
					/>
				</div>
			)}
			{definition.content && (
				<div className={classes.content}>
					<component.Slot
						definition={definition}
						listName="content"
						path={path}
						accepts={["uesio.standalone"]}
						context={context}
					/>
				</div>
			)}
			{portals}
		</div>
	)
}

export default Tile
