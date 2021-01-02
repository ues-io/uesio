// it is important to set global var before any imports

// eslint-disable-next-line @typescript-eslint/naming-convention
declare let __webpack_public_path__: string

declare global {
	interface Window {
		monacoPublicPath: string
	}
}

import React, { lazy, createElement, FunctionComponent, Suspense } from "react"
import { LinearProgress } from "@material-ui/core"
import { diffLines, Change } from "diff"

import {
	ChangeHandler,
	EditorWillMount,
	EditorDidMount,
} from "react-monaco-editor"

// eslint-disable-next-line prefer-const, @typescript-eslint/no-unused-vars
__webpack_public_path__ = window.monacoPublicPath

const LaziestMonaco = lazy(
	() =>
		import(
			/* webpackChunkName: "react-monaco-editor" */ "react-monaco-editor"
		)
)

interface Props {
	value?: string
	language?: string
	onChange?: ChangeHandler
	editorWillMount?: EditorWillMount
	editorDidMount?: EditorDidMount
	editorDecoration?: {
		gutterClass: string
		doForceUpdate: boolean
		currentPlainYaml: string
		previousPlainYaml: string
	}
}

const LazyMonaco: FunctionComponent<Props> = ({
	value,
	language,
	onChange,
	editorWillMount,
	editorDidMount,
	editorDecoration: {
		gutterClass,
		doForceUpdate,
		currentPlainYaml,
		previousPlainYaml,
	},
}) => {
	// force the LazyMonaco component to unmount if hasYamlChanged is true
	/*	{...(hasYamlChanged && yamlDocContent
						? { key: md5(yamlDocContent) }
						: {})}
	*/
	if (doForceUpdate) {
		const diff: Change[] = diffLines(currentPlainYaml, previousPlainYaml)
		return (
			<Suspense key={Date.now()} fallback={createElement(LinearProgress)}>
				<LaziestMonaco
					value={value}
					language={language || "yaml"}
					options={{
						automaticLayout: true,
						minimap: {
							enabled: false,
						},
						//quickSuggestions: true,
					}}
					onChange={(newValue, event): void => {
						onChange?.(newValue, event)
					}}
					editorWillMount={(monaco): void => {
						editorWillMount?.(monaco)
					}}
					editorDidMount={(editor, monaco): void => {
						editorDidMount?.(editor, monaco)

						console.log("currentPlainYaml", currentPlainYaml)
						console.log("previousPlainYaml", previousPlainYaml)
						if (
							diff?.[0]?.count &&
							diff?.[1]?.count &&
							diff?.[1]?.added
						) {
							const startOffset = diff[0].count + 1
							const endOffset = startOffset + diff[1].count - 1
							editor.deltaDecorations(
								[],
								[
									{
										range: new monaco.Range(
											startOffset,
											1,
											endOffset,
											1
										),
										options: {
											isWholeLine: true,
											linesDecorationsClassName: gutterClass,
										},
									},
								]
							)
						}
					}}
				/>
			</Suspense>
		)
	}
	return (
		<Suspense fallback={createElement(LinearProgress)}>
			<LaziestMonaco
				value={value}
				language={language || "yaml"}
				options={{
					automaticLayout: true,
					minimap: {
						enabled: false,
					},
					//quickSuggestions: true,
				}}
				onChange={(newValue, event): void => {
					onChange?.(newValue, event)
				}}
				editorWillMount={(monaco): void => {
					editorWillMount?.(monaco)
				}}
				editorDidMount={(editor, monaco): void => {
					editorDidMount?.(editor, monaco)
				}}
			/>
		</Suspense>
	)
}

export default LazyMonaco
