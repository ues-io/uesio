import { api, signal, definition, styles } from "@uesio/ui"

type ImageDefinition = {
	file?: string
	height?: number
	width?: number
	signals?: signal.SignalDefinition[]
	loading: "lazy" | "eager"
	alt: string
	src?: string
}

const Image: definition.UC<ImageDefinition> = (props) => {
	const { definition, context } = props

	const classes = styles.useStyleTokens(
		{
			root: [
				definition.height !== undefined && `h-[${definition.height}px]`,
				definition.width !== undefined && `w-[${definition.width}px]`,
			],
		},
		props
	)

	return (
		<img
			onClick={api.signal.getHandler(definition.signals, context)}
			id={api.component.getComponentIdFromProps(props)}
			className={classes.root}
			src={
				definition.file
					? api.file.getURLFromFullName(
							context,
							context.mergeString(definition.file)
					  )
					: context.mergeString(definition.src)
			}
			loading={definition.loading}
			alt={definition.alt}
			height={definition.height}
			width={definition.width}
		/>
	)
}

export default Image
