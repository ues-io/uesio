import { FunctionComponent } from "react"
import { definition, styles } from "@uesio/ui"

interface ProgressCircleUtilityProps extends definition.UtilityProps {
	animationDuration: number
	progress: number
}

const ProgressCircle: FunctionComponent<ProgressCircleUtilityProps> = (
	props
) => {
	const animationDuration = props.animationDuration
	const classes = styles.useUtilityStyles(
		{
			// root: {
			// 	`@keyframes circle-anim` {
			// 		"0%" : {
			// 			transform: "rotate(0deg)",
			// 		},
			// 		"100%" : {
			// 			transform: "rotate(360deg)",
			// 		}
			// },
			outercircle: {
				width: "5rem",
				height: "5rem",
				backgroundColor: "#fff",
				margin: "auto",
				position: "absolute",
				top: "0",
				left: "0",
				right: "0",
				bottom: "0",
				borderRadius: "50%",
			},
			innercircle: {
				borderRadius: "inherit",
				backgroundImage:
					"conic-gradient(#fff, rgba(80,200,120,0.3), rgb(80,200,120))",
				position: "absolute",
				zIndex: "-1",
				margin: "auto",
				top: "-0.8rem",
				bottom: "-0.8rem",
				left: "-0.8rem",
				right: "-0.8rem",
				animation: `circle-anim ${animationDuration}s linear infinite`,
			},
		},
		props
	)

	return (
		<div className={classes.outercircle}>
			<div className={classes.innercircle} />
		</div>
	)
}

export { ProgressCircleUtilityProps }

export default ProgressCircle
