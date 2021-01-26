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

import {
	ChangeHandler,
	EditorWillMount,
	EditorDidMount,
	monaco,
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
	options?: monaco.editor.IEditorOptions
}

const LazyMonaco: FunctionComponent<Props> = ({
	value,
	language,
	onChange,
	editorWillMount,
	editorDidMount,
	options,
}) => (
	<Suspense fallback={createElement(LinearProgress)}>
		<LaziestMonaco
			value={value}
			language={language || "yaml"}
			onChange={(newValue, event): void => {
				onChange?.(newValue, event)
			}}
			editorWillMount={(monaco): void => {
				editorWillMount?.(monaco)
			}}
			editorDidMount={(editor, monaco): void => {
				editorDidMount?.(editor, monaco)
			}}
			{...(options || {})}
		/>
	</Suspense>
)

export default LazyMonaco
