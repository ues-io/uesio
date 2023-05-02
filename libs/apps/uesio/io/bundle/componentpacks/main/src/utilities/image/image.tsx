import { api, definition, styles } from "@uesio/ui"

type ImageProps = {
	file?: string
	height?: number
	width?: number
	onClick?: () => void
	loading: "lazy" | "eager"
	alt: string
	src?: string
}

const Image: definition.UtilityComponent<ImageProps> = (props) => {
	const { id, file, height, width, onClick, loading, alt, src, context } =
		props

	const classes = styles.useUtilityStyleTokens(
		{
			root: [
				height !== undefined && `h-[${height}px]`,
				width !== undefined && `w-[${width}px]`,
			],
		},
		props,
		"uesio/io.image"
	)

	return (
		<img
			onClick={onClick}
			id={id}
			className={classes.root}
			src={
				file
					? api.file.getURLFromFullName(
							context,
							context.mergeString(file)
					  )
					: context.mergeString(src)
			}
			loading={loading}
			alt={alt}
			height={height}
			width={width}
		/>
	)
}

export default Image
