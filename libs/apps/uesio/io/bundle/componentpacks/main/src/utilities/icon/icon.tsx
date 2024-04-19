import { definition, styles } from "@uesio/ui"

interface IconUtilityProps {
	icon?: string
	fill?: boolean
	weight?: number
}

const Icon: definition.UtilityComponent<IconUtilityProps> = (props) => {
	const { fill = true, weight = 400 } = props

	const classes = styles.useUtilityStyleTokens(
		{
			root: [
				"inline-block",
				"isicon",
				"font-[Material_Icons]",
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
