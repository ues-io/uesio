import { api, definition, component } from "@uesio/ui"
import { useEffect, useState } from "react"
import { UserFileMetadata } from "../field/field"
import { default as IOTile } from "../../utilities/tile/tile"

type Definition = {
	levels?: 1 | 2 | 3 | 4 | 5 | 6
	fieldId?: string
}

const getHeadingOverview = (mdValue: string, level: 1 | 2 | 3 | 4 | 5 | 6) => {
	const regXHeader = /(?<flag>#{1,6})\s+(?<content>.+)/g
	// Create workable objects to render tiles from + remove h1 heading
	return mdValue
		.match(regXHeader)
		?.map((el) => {
			const content = el.replace(/^(#{1,6})\s+/, "")
			const number = el.match(/#/g)?.length || 1
			if (number > level) return null
			return {
				heading: number,
				content,
				id: content
					.toLowerCase()
					.replace(/ /g, "-")
					.replace(/[^\w-]+/g, ""),
			}
		})
		.filter((el) => el && el.heading !== 1) as {
		heading: number
		content: string
		id: string
	}[]
}

const MarkdownNavigation: definition.UC<Definition> = (props) => {
	const { definition, context } = props

	const [activeSection, setActiveSection] = useState("")

	useEffect(() => {
		const handleScroll = () => {
			const sections = document.querySelectorAll("h2[id]")
			let currentSection = ""

			sections.forEach((section) => {
				const rect = section.getBoundingClientRect()
				const sectionTop = rect.top
				if (sectionTop <= window.innerHeight / 2) {
					currentSection = section.id
				}
			})

			setActiveSection(currentSection)
		}

		const container = document.querySelector("div#root")
		if (!container) return

		container.addEventListener("scroll", handleScroll)
		return () => container.removeEventListener("scroll", handleScroll)
	}, [])

	const record = context.getRecord()
	const wire = context.getWire()
	if (!wire || !record) return null
	const userFile = record.getFieldValue(
		definition.fieldId || ""
	) as UserFileMetadata
	if (!userFile) return null
	const [value] = api.file.useUserFile(context, userFile)

	const headingOverview =
		getHeadingOverview(value, definition.levels || 2) || []

	return headingOverview.length > 0 ? (
		<>
			{headingOverview.map((el, index) => {
				const active = activeSection
					? activeSection === el.id
					: index === 0
				return (
					<IOTile
						key={el.id + el.heading}
						variant={definition[component.STYLE_VARIANT]}
						styleTokens={definition[component.STYLE_TOKENS]}
						context={context}
						onClick={(e) => {
							e.preventDefault()
							document
								.querySelector("#" + CSS.escape(el.id))
								?.scrollIntoView({
									behavior: "smooth",
								})
						}}
						isSelected={active}
						link={"#" + el.id}
					>
						{el.content}
					</IOTile>
				)
			})}
		</>
	) : null
}

export default MarkdownNavigation
