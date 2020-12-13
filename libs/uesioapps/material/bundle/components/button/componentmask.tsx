import React, { FunctionComponent } from "react"
import { material } from "@uesio/ui"

const useStyles = material.makeStyles(() =>
	material.createStyles({
		mask: {
			top: "0",
			left: "0",
			width: "100%",
			height: "100%",
			position: "absolute",
		},
	})
)

const ComponentMask: FunctionComponent<unknown> = () => {
	const classes = useStyles({})
	return <div className={classes.mask} />
}

export default ComponentMask
