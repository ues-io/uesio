import React, { ReactElement } from "react"
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

function ComponentMask(): ReactElement {
	const classes = useStyles({})
	return <div className={classes.mask}></div>
}

export default ComponentMask
