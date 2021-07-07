import { definition, builder, signal } from "@uesio/ui"

type ImageDefinition = {
	file?: string
	height?: string
	align?: "left" | "center" | "right"
	signals?: signal.SignalDefinition[]
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
			],
		},
	],
	classes: ["root"],
	type: "component",
}
export { ImageProps, ImageDefinition }

export default ImagePropertyDefinition
