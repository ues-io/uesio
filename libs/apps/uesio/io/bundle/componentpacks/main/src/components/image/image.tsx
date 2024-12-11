import { api, signal, definition, component } from "@uesio/ui"
import { default as IOImage } from "../../utilities/image/image"

type ImageDefinition = {
	file?: string
	filepath?: string
	// The image height in pixels
	height?: number
	// The image width in pixels
	intrinsicHeight?: number
	intrinsicWidth?: number
	width?: number
	signals?: signal.SignalDefinition[]
	loading: "lazy" | "eager"
	alt: string
	src?: string
}

const Image: definition.UC<ImageDefinition> = (props) => {
	const { definition, context } = props
	const {
		loading,
		src,
		file,
		width,
		height,
		alt,
		filepath,
		intrinsicHeight,
		intrinsicWidth,
	} = definition

	const [link, handler] = api.signal.useLinkHandler(
		definition.signals,
		context
	)

	return (
		<IOImage
			id={api.component.getComponentIdFromProps(props)}
			variant={definition[component.STYLE_VARIANT]}
			styleTokens={definition[component.STYLE_TOKENS]}
			onClick={handler}
			link={link}
			context={context}
			loading={loading}
			src={src}
			file={file}
			filepath={filepath}
			alt={alt}
			height={height}
			width={width}
			intrinsicHeight={intrinsicHeight}
			intrinsicWidth={intrinsicWidth}
		/>
	)
}

export default Image
