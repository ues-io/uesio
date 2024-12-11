import { MouseEvent } from "react"
import { api, definition, styles } from "@uesio/ui"

type ImageProps = {
	file?: string
	filepath?: string
	height?: number
	width?: number
	intrinsicHeight?: number
	intrinsicWidth?: number
	onClick?: (e: MouseEvent) => void
	loading: "lazy" | "eager"
	alt: string
	src?: string
	link?: string
}

const Image: definition.UtilityComponent<ImageProps> = (props) => {
	const {
		id,
		file,
		filepath,
		height,
		width,
		intrinsicHeight,
		intrinsicWidth,
		onClick,
		loading,
		alt,
		src,
		context,
		link,
	} = props

	const classes = styles.useUtilityStyleTokens(
		{
			root: [
				height !== undefined && `h-[${height}px]`,
				width !== undefined && `w-[${width}px]`,
			],
			link: [
				"block",
				height !== undefined && `h-[${height}px]`,
				width !== undefined && `w-[${width}px]`,
			],
		},
		props,
		"uesio/io.image"
	)

	const imageNode = (
		<img
			onClick={onClick}
			id={id}
			className={classes.root}
			src={
				file
					? api.file.getURLFromFullName(
							context,
							context.mergeString(file),
							filepath ? context.mergeString(filepath) : undefined
						)
					: context.mergeString(src)
			}
			loading={loading}
			alt={alt}
			height={intrinsicHeight}
			width={intrinsicWidth}
		/>
	)

	return link ? (
		<a className={classes.link} href={link}>
			{imageNode}
		</a>
	) : (
		imageNode
	)
}

export default Image
