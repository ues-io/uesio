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

/*
const ImagePropertyDefinition: builder.BuildPropertiesDefinition = {
	title: "Image",
	description: "Display an image.",
	link: "https://docs.ues.io/",
	defaultDefinition: () => ({}),
	properties: [
		{
			name: "file",
			type: "METADATA",
			metadataType: "FILE",
			label: "File",
		},
		{
			name: "src",
			type: "TEXT",
			label: "url",
		},
		{
			name: "alt",
			type: "TEXT",
			label: "Alt text",
		},
		{
			name: "height",
			type: "TEXT",
			label: "Height",
		},
		{
			name: "align",
			type: "SELECT",
			label: "Alignment",
			options: [
				{
					value: "left",
					label: "Left",
				},
				{
					value: "center",
					label: "Center",
				},
				{
					value: "right",
					label: "Right",
				},
			],
		},
		{
			name: "loading",
			type: "SELECT",
			label: "Loading",
			options: [
				{
					value: "lazy",
					label: "Lazy",
				},
				{
					value: "eager",
					label: "Eager",
				},
			],
		},
	],
	sections: [
		{
			title: "Signals",
			type: "SIGNALS",
		},
	],
	traits: ["uesio.standalone"],
	classes: ["root", "inner"],
	type: "component",
	category: "CONTENT",
}
*/

export default Image
