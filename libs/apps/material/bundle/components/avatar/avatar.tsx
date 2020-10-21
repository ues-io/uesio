import React, { ReactElement } from "react"

import { material, styles } from "uesio"
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
			...styles.getMarginStyles(props.definition.margin, theme),
		}),
	})
)

function Avatar(props: AvatarProps): ReactElement {
	const classes = useStyles(props)
	const avatarProps = {
		className: classes.root,
	}

	return <material.Avatar {...avatarProps}>BH</material.Avatar>
}

export default Avatar
