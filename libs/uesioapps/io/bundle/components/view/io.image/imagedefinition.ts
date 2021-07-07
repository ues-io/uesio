import { definition, builder, signal } from "@uesio/ui"

type ImageDefinition = {
	file?: string
	height?: string
	align?: "left" | "center" | "right"
	signals?: signal.SignalDefinition[]
	loading: "lazy" | "eager"
	alt: string
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
					type: "FILE",
					label: "Source",
				},
				{
					name: "alt",
					type: "TEXT",
					label: "Alt text",
				},
				{
					name: "align",
					type: "SELECT",
					label: "Source",
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
	traits: ["uesio.standalone"],
	classes: ["root"],
	type: "component",
}
export { ImageProps, ImageDefinition }

export default ImagePropertyDefinition
