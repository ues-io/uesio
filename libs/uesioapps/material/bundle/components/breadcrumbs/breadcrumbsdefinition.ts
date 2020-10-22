import { definition, builder, signal } from "@uesio/ui"

type CrumbDefinition = {
	text: string
	href: string
	signals: signal.ComponentSignal[]
}

type BreadcrumbsDefinition = {
	crumbs: CrumbDefinition[]
}

interface BreadcrumbsProps extends definition.BaseProps {
	definition?: BreadcrumbsDefinition
}

const BreadcrumbsPropertyDefinition: builder.BuildPropertiesDefinition = {
	title: "Breadcrumbs",
	defaultDefinition: () => ({}),
	sections: [],
}
export { BreadcrumbsProps }

export default BreadcrumbsPropertyDefinition
