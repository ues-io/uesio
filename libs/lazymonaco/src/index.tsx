// it is important to set global var before any imports

// eslint-disable-next-line @typescript-eslint/naming-convention
declare let __webpack_public_path__: string

declare global {
	interface Window {
		monacoPublicPath: string
	}
}

import { lazy, createElement, FunctionComponent, Suspense } from "react"

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
	height?: string
}

const LazyMonaco: FunctionComponent<Props> = ({
	value,
	language,
	onChange,
	editorWillMount,
	editorDidMount,
	options,
	height,
}) => (
	<Suspense fallback={<div>Loading</div>}>
		<LaziestMonaco
			height={height}
			value={value}
			language={language || "yaml"}
			onChange={onChange}
			editorWillMount={editorWillMount}
			editorDidMount={editorDidMount}
			{...(options ? { options } : {})}
		/>
	</Suspense>
)

export default LazyMonaco
