import { FunctionComponent } from "react"
import { SectionRendererProps } from "./sectionrendererdefinition"
import ExpandPanel from "../expandpanel"
import { builder } from "@uesio/ui"
import PropList from "./proplist"

const StylesSection: FunctionComponent<SectionRendererProps> = (props) => {
	const { path, context, propsDef, valueAPI } = props
	const section = props.section as builder.PropListSection

	//only add the variant if the propsDef is component !!! TO-DO

	console.log("TYPE propDEf", propsDef.type)

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
						//display: [{}]
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

	console.log("properties", properties)

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
