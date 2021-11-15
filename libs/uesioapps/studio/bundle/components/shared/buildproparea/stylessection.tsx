import { FunctionComponent } from "react"
import { SectionRendererProps } from "./sectionrendererdefinition"
import ExpandPanel from "../expandpanel"
import { builder } from "@uesio/ui"
import PropList from "./proplist"

const StylesSection: FunctionComponent<SectionRendererProps> = (props) => {
	const { path, context, propsDef, valueAPI } = props
	const section = props.section as builder.PropListSection
	const properties: builder.PropDescriptor[] =
		propsDef.type !== "componentvariant"
			? [
					{
						name: "uesio.variant",
						type: "METADATA",
						metadataType: "COMPONENTVARIANT",
						label: "Variant",
						groupingParents: 1,
						getGroupingFromKey: true,
						//display: [{}] //TO-DO This can be done in anther way
					},
					{
						name: "uesio.styles",
						type: "STYLESLIST",
						label: "Variant",
					},
			  ]
			: [
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
				propsDef={propsDef}
				properties={properties}
				context={context}
				valueAPI={valueAPI}
			/>
		</ExpandPanel>
	)
}

export default StylesSection
