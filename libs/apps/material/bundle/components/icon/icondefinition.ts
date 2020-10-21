import { definition, builder, styles } from "uesio"

type IconDefinition = {
	type: string
	size?: "inherit" | "default" | "large" | "small" | undefined
	float?: styles.FloatDefinition
	margin?: styles.MarginDefinition
}

interface IconProps extends definition.BaseProps {
	definition: IconDefinition
}

const IconPropertyDefinition: builder.BuildPropertiesDefinition = {
	title: "Icon",
	defaultDefinition: () => ({}),
	sections: [
		{
			title: "Display",
			type: "PROPLIST",
			properties: [
				{
					name: "type",
					type: "TEXT",
					label: "Source",
				},
				{
					name: "size",
					type: "TEXT",
					label: "Size",
				},
				{
					name: "float",
					type: "SELECT",
					label: "Float",
					options: [
						{
							value: "none",
							label: "None",
						},
						{
							value: "left",
							label: "Left",
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
export { IconProps, IconDefinition }

export default IconPropertyDefinition
