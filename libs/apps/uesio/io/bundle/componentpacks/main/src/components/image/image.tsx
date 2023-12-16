import { api, signal, definition, styles } from "@uesio/ui"
import { default as IOImage } from "../../utilities/image/image"

type ImageDefinition = {
	file?: string
	// The image height in pixels
	height?: number
	// The image width in pixels
	width?: number
	signals?: signal.SignalDefinition[]
	loading: "lazy" | "eager"
	alt: string
	src?: string
}

const StyleDefaults = Object.freeze({
	root: [],
})

const Image: definition.UC<ImageDefinition> = (props) => {
	const { definition, context } = props
	const { loading, src, file, width, height, alt } = definition

	const classes = styles.useStyleTokens(StyleDefaults, props)

	const [link, handler] = api.signal.useLinkHandler(
		definition.signals,
		context
	)

	return (
		<IOImage
			id={api.component.getComponentIdFromProps(props)}
			onClick={handler}
			link={link}
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
