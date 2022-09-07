import React, { FC, useState } from "react"
import { context, component, styles } from "@uesio/ui"

const Icon = component.getUtility("uesio/io.icon")
const SelectField = component.getUtility("uesio/io.selectfield")
type T = {
	context: context.Context
	onChange: (value: Value) => void
}

type Dimension = {
	label: string
	name: string
	value: Value
}

type Value = [number, number]

const reverse = (arr: unknown[]) =>
	arr.map((item, idx) => arr[arr.length - 1 - idx])

const useDimension = (onChange?: (value: Value) => void) => {
	const [dimension, setDimension] = useState<Dimension>({
		label: "",
		value: [1900, 899],
		name: "",
	})
	const [landscape, setLandscape] = useState(false)
	// const [dimension, setDimension] = useState<Dimension>(selectedDimension)

	const presets: Dimension[] = [
		{
			label: "Small laptop",
			name: "LAPTOP_SMALL",
			value: [1200, 0],
		},
		{
			label: "iPad Air",
			name: "IPAD_AIR",
			value: [820, 1180],
		},
		{
			label: "iPhone SE",
			name: "IPHONE_SE",
			value: [375, 667],
		},
	]

	const options = presets.map(({ label, name }) => ({
		label,
		value: name,
	}))

	const updateDimension = (name: string) => {
		const option = presets.find((d) => d.name === name)
		if (!option) {
			console.log("that option doesn;t exist", name)
			return
		}
		const d = {
			...option,
			value: (landscape ? reverse(option.value) : option.value) as Value,
		}
		setDimension(d)
	}
	const setCustom = (value: Value) => {
		setDimension({ label: "Custom", name: "custom", value })
	}

	const toggleLandscape = () => {
		setDimension({
			...dimension,
			value: reverse(dimension.value) as Value,
		})
		setLandscape(!landscape)
	}

	React.useEffect(() => {
		onChange && onChange(dimension.value)
	}, [dimension])

	return { dimension, updateDimension, setCustom, options, toggleLandscape }
}

const ViewPortSelector: FC<T> = (props) => {
	const { context, onChange } = props
	const {
		dimension: {
			name,
			value: [x, y],
		},
		updateDimension,
		setCustom,
		options,
		toggleLandscape,
	} = useDimension(onChange)

	const [[typingX, typingY], setIntermediateVal] = useState<Value>([x, y])

	React.useEffect(() => {
		setIntermediateVal([x, y])
	}, [x, y])

	const handleBlur = (axis: "x" | "y") => {
		const newVal = [
			axis === "x" ? typingX : x,
			axis === "y" ? typingY : y,
		] as Value
		setCustom(newVal)
	}

	const handleKeyDown = (key: string, axis: "x" | "y") =>
		key === "Enter" && handleBlur(axis)

	return (
		<div
			style={{
				padding: "8px 4px",
				textAlign: "center",
			}}
		>
			<div style={{ display: "inline-flex", gap: "5px" }}>
				<span style={{ color: "rgb(100, 100, 100)" }}>
					Dimensions:{" "}
				</span>
				{/* Select */}
				<select
					value={name}
					onChange={(e) => updateDimension(e.target.value)}
				>
					<option disabled={true} hidden={true} value={"custom"}>
						Custom
					</option>
					{options?.map((option) => (
						<option key={option.value} value={option.value}>
							{option.label}
						</option>
					))}
				</select>

				{/* X */}
				<input
					type="number"
					value={typingX}
					onChange={(e) =>
						setIntermediateVal([parseInt(e.target.value, 10), y])
					}
					onBlur={() => handleBlur("x")}
					onKeyDown={(e) => handleKeyDown(e.key, "x")}
				/>
				{/* Y */}
				<input
					value={typingY}
					onChange={(e) =>
						setIntermediateVal([x, parseInt(e.target.value, 10)])
					}
					onBlur={() => handleBlur("y")}
					onKeyDown={(e) => handleKeyDown(e.key, "y")}
				/>
				{/* Orientation */}
				<button onClick={() => toggleLandscape()}>
					<Icon context={context} icon={"screen_rotation"} />
				</button>
			</div>
		</div>
	)
}

export default ViewPortSelector
