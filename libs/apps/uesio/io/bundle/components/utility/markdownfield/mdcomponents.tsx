import { Options } from "react-markdown"
import { context, component, styles, definition } from "@uesio/ui"
import React, { FC } from "react"
import { IconUtilityProps } from "../icon/icon"

import { MDOptions } from "./types"
import { PrismLight as SyntaxHighlighter } from "react-syntax-highlighter"
import { materialDark } from "react-syntax-highlighter/dist/esm/styles/prism"
const IOButton = component.registry.getUtility("uesio/io.button")
const Icon = component.registry.getUtility<IconUtilityProps>("uesio/io.icon")

import bash from "react-syntax-highlighter/dist/esm/languages/prism/bash"
import yaml from "react-syntax-highlighter/dist/esm/languages/prism/yaml"

SyntaxHighlighter.registerLanguage("bash", bash)
SyntaxHighlighter.registerLanguage("yaml", yaml)

type HeadingProps = {
	element: "h1" | "h2" | "h3" | "h4" | "h5" | "h6"
	context: context.Context
	classes: Record<string, string>
	children: React.ReactNode & React.ReactNode[]
	options: MDOptions
}

const Heading: FC<HeadingProps> = ({
	element: Element,
	context,
	classes,
	children,
	options,
}) => {
	const { origin, pathname } = window.location
	const id = String(children)
		.toLowerCase()
		.replace(/ /g, "-")
		.replace(/[^\w-]+/g, "")
	const shareUrl = `${origin + pathname}#${id || ""}`
	return (
		<div
			style={{
				position: "relative",
				display: "flex",
				alignItems: "center",
			}}
		>
			<Element id={id} className={classes[Element]}>
				{children}{" "}
				{options.hashheadings && (
					<span
						className="actions"
						style={{
							verticalAlign: "middle",
						}}
					>
						<IOButton
							variant="uesio/io.markdownaction"
							icon={<Icon context={context} icon={"link"} />}
							context={context}
							onClick={() => {
								navigator.clipboard.writeText(shareUrl)
							}}
						/>
					</span>
				)}
			</Element>
		</div>
	)
}

const components = (
	context: context.Context,
	classes: Record<string, string>,
	options: MDOptions
): Options["components"] => ({
	h1({ children }) {
		return (
			<Heading
				element={"h1"}
				context={context}
				classes={classes}
				children={children}
				options={options}
			/>
		)
	},
	h2({ children }) {
		return (
			<Heading
				element={"h2"}
				context={context}
				classes={classes}
				children={children}
				options={options}
			/>
		)
	},
	h3({ children }) {
		return (
			<Heading
				element={"h3"}
				context={context}
				classes={classes}
				children={children}
				options={options}
			/>
		)
	},
	h4({ children }) {
		return (
			<Heading
				element={"h4"}
				context={context}
				classes={classes}
				children={children}
				options={options}
			/>
		)
	},
	h5({ children }) {
		return (
			<Heading
				element={"h5"}
				context={context}
				classes={classes}
				children={children}
				options={options}
			/>
		)
	},
	h6({ children }) {
		return (
			<Heading
				element={"h6"}
				context={context}
				classes={classes}
				children={children}
				options={options}
			/>
		)
	},
	code({ node, inline, className, children, ...props }) {
		const match = /language-(\w+)/.exec(className || "")
		return !inline && match ? (
			<div className={classes.codeblock}>
				<div className={styles.cx(classes.codeToolbar, "codeToolbar")}>
					<IOButton
						variant="uesio/io.markdowncodeaction"
						icon={<Icon context={context} icon={"copy"} />}
						label={""}
						context={context}
						onClick={() => {
							navigator.clipboard.writeText(String(children))
						}}
					/>
				</div>
				<SyntaxHighlighter
					children={String(children).replace(/\n$/, "")}
					style={materialDark}
					language={match[1]}
					PreTag="div"
					{...props}
				/>
			</div>
		) : (
			<code className={className} {...props}>
				{children}
			</code>
		)
	},
})

export default components
