import { api, signal, definition, styles } from "@uesio/ui"

type ImageDefinition = {
	file?: string
	height?: string
	align?: "left" | "center" | "right"
	signals?: signal.SignalDefinition[]
	loading: "lazy" | "eager"
	alt: string
	src?: string
}

const Image: definition.UC<ImageDefinition> = (props) => {
	const { definition, context } = props

	const classes = styles.useStyles(
		{
			root: {
				display: "block",
				textAlign: definition?.align || "left",
				lineHeight: 0,
				cursor: definition?.signals ? "pointer" : "",
			},
			inner: {
				display: "inline-block",
				height: definition?.height,
			},
		},
		props
	)

	return (
		<div
			className={classes.root}
			onClick={api.signal.getHandler(definition.signals, context)}
		>
			<img
				id={api.component.getComponentIdFromProps(props)}
				className={classes.inner}
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
			/>
		</div>
	)
}

export default Image
