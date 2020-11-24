import React, { FunctionComponent } from "react"

import { material, styles } from "@uesio/ui"

interface Props {
	primary?: string
	secondary?: string
	error?: string
}

const useStyles = material.makeStyles((theme) =>
	material.createStyles({
		root: (props: Props) => ({}),
	})
)
const ThemeMaker: FunctionComponent<Props> = (props) => {
	const classes = useStyles(props)
	console.log("ThemeMaker", props)
	return (
		<div className={classes.root}>
			<h2>Theme maker</h2>
		</div>
	)
}

export default ThemeMaker
