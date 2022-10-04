import { definition, styles } from "@uesio/ui"

import { FC } from "react"

interface T extends definition.UtilityProps {
	isHovering: boolean
	index: number
	label?: string
	message?: string
	hideIfNotLast?: boolean
}
const PlaceHolder: FC<T> = (props) => {
	const {
		isHovering,
		label = "Component Area",
		message = "",
		index,
		hideIfNotLast,
	} = props

	const classes = styles.useStyles(
		{
			label: {
				opacity: 0.3,
				fontSize: "0.7em",
				textAlign: "center",
				transition: "all 0.125s ease",
				...(isHovering && {
					opacity: 0.5,
				}),
			},
			message: {
				opacity: 0.2,
				fontSize: "0.6em",
				textAlign: "center",
				padding: "10px",
				transition: "all 0.125s ease",
				...(isHovering && {
					opacity: 0.4,
				}),
			},
			placeholder: {
				borderRadius: "6px",
				border: "1px dashed #eee",
				transition: "all 0.125s ease",
				...(isHovering && {
					border: "1px dashed #ccc",
					backgroundColor: "#e5e5e5",
				}),
				display: "grid",
				alignItems: "center",
				justifyItems: "center",
			},
			wrapper: {
				padding: "6px",
				minWidth: "60px",
				minHeight: "60px",
				display: "grid",
				...(hideIfNotLast && {
					display: "none",
					"&:last-child": {
						display: "grid",
					},
				}),
			},
		},
		props
	)
	return (
		<div
			className={classes.wrapper}
			data-placeholder="true"
			data-index={index}
		>
			<div className={classes.placeholder}>
				<div>
					<div className={classes.label}>{label}</div>
					{message && (
						<div className={classes.message}>{message}</div>
					)}
				</div>
			</div>
		</div>
	)
}

export default PlaceHolder
