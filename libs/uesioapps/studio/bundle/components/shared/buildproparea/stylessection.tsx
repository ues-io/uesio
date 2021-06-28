import { FunctionComponent } from "react"
import { SectionRendererProps } from "./sectionrendererdefinition"
import ExpandPanel from "../expandpanel"
import { builder } from "@uesio/ui"
import PropList from "./proplist"

const StylesSection: FunctionComponent<SectionRendererProps> = (props) => {
	const { path, definition, context } = props
	const section = props.section as builder.PropListSection

	const properties: builder.PropDescriptor[] = [
		{
			name: "uesio.variant",
			type: "METADATA",
			metadataType: "COMPONENTVARIANT",
			label: "Variant",
			groupingParents: 1,
			groupingProperty: "component",
		},
		{
			name: "uesio.styles",
			type: "METADATALIST",
			metadataType: "COMPONENTSTYLES",
			label: "Variant",
			classes: section.classes || [],
			// groupingParents: 1,
			// groupingProperty: "component",
			getGroupingFromKey: true,
		},
	]

	return (
		<ExpandPanel
			defaultExpanded={false}
			title={section.title}
			context={context}
		>
			<PropList
				path={path}
				definition={definition}
				properties={properties}
				context={context}
				section={section}
			/>
		</ExpandPanel>
	)
}

export default StylesSection
