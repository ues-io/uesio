import { definition, builder } from "@uesio/ui"

type TitleBarDefinition = {
	title: string
	subtitle: string
}

interface TitleBarProps extends definition.BaseProps {
	definition: TitleBarDefinition
}

const TitleBarPropertyDefinition: builder.BuildPropertiesDefinition = {
	title: "Button",
	defaultDefinition: () => ({}),
	properties: [],
	sections: [],
	actions: [],
}
export { TitleBarProps, TitleBarDefinition }

export default TitleBarPropertyDefinition
