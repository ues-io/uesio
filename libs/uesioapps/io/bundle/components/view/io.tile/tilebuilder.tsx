import { FC } from "react"
import { TileProps } from "./tiledefinition"
import Tile from "./tile"
import { styles, component } from "@uesio/ui"

const BuildWrapper = component.registry.getUtility("studio.buildwrapper")

const TileBuilder: FC<TileProps> = (props) => {
	const classes = styles.useStyles(
		{
			inner: {
				pointerEvents: "none",
			},
		},
		{
			context: props.context,
		}
	)

	return (
		<BuildWrapper {...props} classes={classes}>
			<Tile {...props} />
		</BuildWrapper>
	)
}

export default TileBuilder
