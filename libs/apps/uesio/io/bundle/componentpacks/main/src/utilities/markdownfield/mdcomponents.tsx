import { context, styles } from "@uesio/ui"
import React from "react"

import { PrismLight as SyntaxHighlighter } from "react-syntax-highlighter"
import { materialDark } from "react-syntax-highlighter/dist/esm/styles/prism"

import bash from "react-syntax-highlighter/dist/esm/languages/prism/bash"
import yaml from "react-syntax-highlighter/dist/esm/languages/prism/yaml"
import { CodeProps, HeadingProps } from "react-markdown/lib/ast-to-react"
import Button from "../button/button"
import Icon from "../icon/icon"

SyntaxHighlighter.registerLanguage("bash", bash)
SyntaxHighlighter.registerLanguage("yaml", yaml)

type HeadingElement = "h1" | "h2" | "h3" | "h4" | "h5" | "h6"

const h = (
	props: React.PropsWithChildren<HeadingProps>,
	context: context.Context,
	classes: Record<string, string>,
	hashHeadings?: boolean
) => {
	const { origin, pathname } = window.location
	const children = props.children
	const id = String(children)
		.toLowerCase()
		.replace(/ /g, "-")
		.replace(/[^\w-]+/g, "")
	const shareUrl = `${origin + pathname}#${id || ""}`
	const Element = ("h" + props.level) as HeadingElement

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
				{hashHeadings && (
					<span
						className="actions"
						style={{
							verticalAlign: "middle",
						}}
					>
						<Button
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

const code = (
	props: React.PropsWithChildren<CodeProps>,
	context: context.Context,
	classes: Record<string, string>
) => {
	const children = props.children
	const className = props.className
	const match = /language-(\w+)/.exec(className || "")

	return !props.inline && match ? (
		<div className={classes.codeblock}>
			<div className={styles.cx(classes.codeToolbar, "codeToolbar")}>
				<Button
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
				{...props}
				children={String(children).replace(/\n$/, "")}
				style={materialDark}
				language={match[1]}
				PreTag="div"
			/>
		</div>
	) : (
		<code className={className} {...props}>
			{children}
		</code>
	)
}

export { h, code }
