import { FunctionComponent } from "react"
import { definition, styles } from "@uesio/ui"

interface IconUtilityProps extends definition.UtilityProps {
	icon?: string
	fill?: boolean
	weight?: number
}

const Icon: FunctionComponent<IconUtilityProps> = (props) => {
	const fill = props.fill === undefined ? true : props.fill
	const weight = props.weight === undefined ? 400 : props.weight

	const classes = styles.useUtilityStyleTokens(
		{
			root: [
				"inline-block",
				"isicon",
				"font-[Material_Icons]",
				"leading-none",
				"align-middle",

				`[font-variation-settings:'FILL'_${
					fill ? "1" : "0"
				},'wght'_${weight}]`,
			],
		},
		props,
		"uesio/io.icon"
	)

	if (props.icon === undefined) return null

	return <span className={classes.root}>{props.icon}</span>
}

export default Icon
