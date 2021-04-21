import { definition, builder } from "@uesio/ui"

type GroupDefinition = {
	align?: string
	width?: string
	components?: definition.DefinitionList
}

interface GroupProps extends definition.BaseProps {
	definition: GroupDefinition
}

const GroupPropertyDefinition: builder.BuildPropertiesDefinition = {
	title: "Grid",
	defaultDefinition: () => ({}),
	properties: [],
	sections: [],
	actions: [],
}
export { GroupProps, GroupDefinition }

export default GroupPropertyDefinition
