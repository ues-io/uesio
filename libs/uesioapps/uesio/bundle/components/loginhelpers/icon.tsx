import { context, styles, definition } from "@uesio/ui"
import React, { FunctionComponent } from "react"

interface IconProps extends definition.BaseProps {
	image: string
}

const useStyles = styles.getUseStyles(
	["loginButtonIcon", "loginButtonIconImage"],
	{
		loginButtonIcon: {
			marginRight: "10px",
			background: "rgb(255, 255, 255)",
			padding: "9px 7px 7px 9px",
			borderRadius: "2px",
		},
		loginButtonIconImage: (props: IconProps) => ({
			width: "22px",
			height: "22px",
			backgroundPosition: "bottom",
			...styles.getBackgroundStyles(
				{
					image: props.image,
					color: "white",
				},
				props.context.getTheme(),
				new context.Context()
			),
		}),
	}
)

const LoginIcon: FunctionComponent<IconProps> = (props) => {
	const classes = useStyles(props)
	return (
		<div className={classes.loginButtonIcon}>
			<div className={classes.loginButtonIconImage} />
		</div>
	)
}

export default LoginIcon
