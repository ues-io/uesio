import { FunctionComponent } from "react"
import { SectionRendererProps } from "./sectionrendererdefinition"
import ExpandPanel from "../expandpanel"
import { builder } from "@uesio/ui"
import PropList from "./proplist"

const StylesSection: FunctionComponent<SectionRendererProps> = (props) => {
	const { path, definition, context, propsDef } = props
	const section = props.section as builder.PropListSection

	const properties: builder.PropDescriptor[] = [
		{
			name: "uesio.variant",
			type: "METADATA",
			metadataType: "COMPONENTVARIANT",
			label: "Variant",
			groupingParents: 1,
			getGroupingFromKey: true,
		},
		{
			name: "uesio.styles",
			type: "STYLESLIST",
			label: "Variant",
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
				propsDef={propsDef}
				properties={properties}
				context={context}
			/>
		</ExpandPanel>
	)
}

export default StylesSection
