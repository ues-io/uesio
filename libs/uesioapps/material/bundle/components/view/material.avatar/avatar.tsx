import React, { FunctionComponent } from "react"

import { styles } from "@uesio/ui"
import * as material from "@material-ui/core"

import { AvatarProps } from "./avatardefinition"

const useStyles = material.makeStyles((theme) =>
	material.createStyles({
		root: (props: AvatarProps) => ({
			fontSize: "10pt",
			fontWeight: 500,
			color: theme.palette.getContrastText(theme.palette.primary.main),
			backgroundColor: theme.palette.primary.main,
			width: theme.spacing(5),
			height: theme.spacing(5),
			...styles.getMarginStyles(
				props.definition.margin,
				props.context.getTheme()
			),
		}),
	})
)

const Avatar: FunctionComponent<AvatarProps> = (props) => {
	const classes = useStyles(props)
	return <material.Avatar className={classes.root}>BH</material.Avatar>
}

export default Avatar
