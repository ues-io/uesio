import { definition, builder, styles, signal } from "@uesio/ui"

type ImageDefinition = {
	file?: string
	height?: string
	align?: "left" | "center" | "right"
	margin: styles.MarginDefinition
	signals?: signal.ComponentSignal[]
}

interface ImageProps extends definition.BaseProps {
	definition: ImageDefinition
}

const ImagePropertyDefinition: builder.BuildPropertiesDefinition = {
	title: "Image",
	defaultDefinition: () => ({}),
	sections: [
		{
			title: "Display",
			type: "PROPLIST",
			properties: [
				{
					name: "file",
					type: "TEXT",
					label: "Source",
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
			],
		},
	],
}
export { ImageProps, ImageDefinition }

export default ImagePropertyDefinition
