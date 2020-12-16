import { context, styles, material } from "@uesio/ui"
import React, { FunctionComponent } from "react"

interface IconProps {
	image: string
}

const useStyles = material.makeStyles((theme) =>
	material.createStyles({
		loginButtonIcon: {
			marginRight: "10px",
			background: "rgb(255, 255, 255)",
			padding: "9px 7px 7px 9px",
			borderRadius: "2px",
		},
		loginButtonIconImage: (props: IconProps) => ({
			width: "22px",
			height: "22px",
			...styles.getBackgroundStyles(
				{
					image: props.image,
					color: "white",
				},
				theme,
				new context.Context()
			),
			backgroundPosition: "bottom",
		}),
	})
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
