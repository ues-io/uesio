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
					type: "METADATA",
					metadataType: "FILE",
					label: "File",
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
			],
		},
		{
			title: "Signals",
			type: "SIGNALS",
		},
	],
	traits: ["uesio.standalone"],
	classes: ["root"],
	type: "component",
}
export { ImageProps, ImageDefinition }

export default ImagePropertyDefinition
