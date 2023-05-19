import { definition, styles } from "@uesio/ui"

import { FC } from "react"

interface T extends definition.UtilityProps {
	isHovering: boolean
	label?: string
	message?: string
	direction?: "HORIZONTAL" | "VERTICAL"
}
const PlaceHolder: FC<T> = (props) => {
	const { isHovering, label } = props

	const classes = styles.useUtilityStyleTokens(
		{
			label: [
				isHovering ? "text-white" : "text-blue-400",
				"text-[8pt]",
				"uppercase",
				isHovering ? "font-medium" : "font-light",
			],
			root: [
				isHovering ? "bg-blue-600" : "bg-blue-50",
				"py-2",
				"px-3",
				"grid",
				"my-1",
				"rounded-md",
				"items-center",
			],
		},
		props
	)
	return (
		<div className={classes.root} data-placeholder="true">
			<div className={classes.label}>{label}</div>
		</div>
	)
}

export default PlaceHolder
