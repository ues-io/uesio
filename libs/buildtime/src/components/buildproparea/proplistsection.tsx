import React, { ReactElement } from "react"
import PropList from "./proplist"
import ExpandPanel from "../toolbar/expandpanel/expandpanel"
import { SectionRendererProps } from "./sectionrendererdefinition"
import { builder } from "@uesio/ui"

function PropListSection(props: SectionRendererProps): ReactElement | null {
	const section = props.section as builder.PropListSection

	return (
		<ExpandPanel defaultExpanded={false} title={section.title}>
			{section.properties && (
				<PropList
					{...{
						path: props.path,
						definition: props.definition,
						properties: section.properties,
						context: props.context,
					}}
				></PropList>
			)}
		</ExpandPanel>
	)
}

export default PropListSection
