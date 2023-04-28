import { api, signal, definition, styles } from "@uesio/ui"
import { default as IOImage } from "../../utilities/image/image"

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
	const { loading, src, file, width, height, alt } = definition

	const classes = styles.useStyleTokens(
		{
			root: [],
		},
		props
	)

	return (
		<IOImage
			id={api.component.getComponentIdFromProps(props)}
			onClick={api.signal.getHandler(definition.signals, context)}
			context={context}
			loading={loading}
			className={classes.root}
			src={src}
			file={file}
			alt={alt}
			height={height}
			width={width}
		/>
	)
}

export default Image
