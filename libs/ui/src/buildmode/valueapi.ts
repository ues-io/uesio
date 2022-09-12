import { Definition } from "../definition/definition"

type ValueAdder = (
	path: string | undefined,
	value: Definition,
	index?: number
) => void

type ValueSetter = (
	path: string | undefined,
	value: Definition,
	autoSelect?: boolean
) => void

type ValueGetter = (path: string | undefined) => Definition

type ValueRemover = (path: string | undefined) => void

type KeyChanger = (path: string | undefined, key: string) => void

type ValueMover = (
	fromPath: string | undefined,
	toPath: string | undefined,
	selectKey?: string
) => void

type ValueCloner = (path: string | undefined) => void

type ValueAPI = {
	set: ValueSetter
	get: ValueGetter
	add: ValueAdder
	remove: ValueRemover
	changeKey: KeyChanger
	move: ValueMover
	clone: ValueCloner
	cloneKey: ValueCloner
	select: (path: string) => void
	isSelected: (path: string) => boolean
	hasSelectedChild: (path: string) => boolean
}

export default ValueAPI
