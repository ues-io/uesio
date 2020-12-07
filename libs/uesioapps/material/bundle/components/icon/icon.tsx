import React, { FunctionComponent } from "react"

import { IconProps } from "./icondefinition"
import { material, styles } from "@uesio/ui"
import getIcon from "./iconmap"

const useStyles = material.makeStyles((theme: material.Theme) =>
	material.createStyles({
		root: (props: IconProps) => ({
			...styles.getFloatStyles(props.definition?.float),
			...styles.getMarginStyles(props.definition?.margin, theme),
		}),
	})
)

const Icon: FunctionComponent<IconProps> = (props) => {
	const classes = useStyles(props)
	const iconType = props.definition?.type
	const iconsize = props.definition?.size || "small"

	const IconLoader = getIcon(iconType)

	return <IconLoader className={classes.root} fontSize={iconsize} />
}

export default Icon
