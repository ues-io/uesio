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
				"m-1",
				isHovering ? "text-white" : "text-slate-700",
				"text-[8pt]",
				"uppercase",
				"font-medium",
			],
			root: [
				isHovering ? "bg-slate-600" : "bg-slate-100",
				"px-4",
				"py-1.5",
				"grid",
				"my-1.5",
				"rounded-md",
				"items-center",
				"border",
				isHovering ? "border-slate-800" : "border-slate-200",
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
