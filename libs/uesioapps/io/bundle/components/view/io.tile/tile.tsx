import { FunctionComponent } from "react"

import { component, styles, hooks } from "@uesio/ui"
import { TileProps } from "./tiledefinition"

const useStyles = styles.getUseStyles(["root", "content", "avatar"], {
	root: (props) => ({
		display: "flex",
		...(props.definition.signals && {
			cursor: "pointer",
		}),
		"&:hover": {
			backdropFilter: "brightness(97%)",
		},
	}),
	content: () => ({
		flex: 1,
	}),
	avatar: () => ({
		marginRight: "8px",
	}),
})

const Tile: FunctionComponent<TileProps> = (props) => {
	const classes = useStyles(props)
	const uesio = hooks.useUesio(props)
	const { definition, context, path } = props
	const [handler, portals] = uesio.signal.useHandler(definition.signals)
	return (
		<div className={classes.root} onClick={handler}>
			<div className={classes.avatar}>
				<component.Slot
					definition={definition}
					listName="avatar"
					path={path}
					accepts={["uesio.standalone"]}
					context={context}
				/>
			</div>
			<div className={classes.content}>
				<component.Slot
					definition={definition}
					listName="content"
					path={path}
					accepts={["uesio.standalone"]}
					context={context}
				/>
			</div>
			{portals}
		</div>
	)
}

export default Tile
