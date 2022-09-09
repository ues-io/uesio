import React, { FC, useState } from "react"
import { context, component } from "@uesio/ui"

const Icon = component.getUtility("uesio/io.icon")

type T = {
	context: context.Context
	onChange: (value: Value) => void
	canvasRef: HTMLDivElement | null
}

type Dimension = {
	label: string
	value: Value
}

const presets: Dimension[] = [
	{
		label: "Small laptop",
		value: [1200, 0],
	},
	{
		label: "iPad Air",
		value: [820, 1180],
	},
	{
		label: "iPad Mini",
		value: [768, 1024],
	},
	{
		label: "iPhone XR",
		value: [414, 896],
	},
	{
		label: "iPhone SE",
		value: [375, 667],
	},
]

type Value = [number, number]

const reverse = (arr: unknown[]) =>
	arr.map((item, idx) => arr[arr.length - 1 - idx])

const useDimension = (
	canvasRef: HTMLDivElement | null,
	onChange?: (value: Value) => void
) => {
	const [dimension, setDimension] = useState<Dimension>({
		label: "",
		value: [0, 0],
	})

	const [orientation, setOrientation] = useState(false) // True means landscape mode

	const options = presets.map(({ label }) => ({
		label,
		value: label,
	}))

	const updateDimension = (label: string) => {
		const option = presets.find((d) => d.label === label)
		if (!option) {
			console.log("that option doesn't exist", name)
			return
		}

		setDimension({
			...option,
			value: (orientation
				? reverse(option.value)
				: option.value) as Value,
		})
	}
	const setCustom = (value: Value) => setDimension({ label: "Custom", value })

	// Set the dimension to the current canvas size
	const setToWindow = (axis?: "x" | "y") => {
		if (!canvasRef) return
		const { marginLeft, marginRight } = getComputedStyle(canvasRef)
		const { offsetWidth, offsetHeight: height } = canvasRef
		if (axis === "y") return setCustom([dimension.value[0], height])

		const width =
			offsetWidth + parseInt(marginLeft, 10) + parseInt(marginRight, 10)
		if (axis === "x") return setCustom([width, dimension.value[1]])
		setCustom([width, height])
	}

	const toggleOrientation = () => {
		setDimension({
			...dimension,
			value: reverse(dimension.value) as Value,
		})
		setOrientation(!orientation)
	}

	React.useEffect(() => {
		// 1.Edge case:  Set to window if x or y (or both) are less than 0
		const [x, y] = dimension.value
		x <= 0 && y <= 0 && setToWindow()
		x <= 0 && setToWindow("x")
		y <= 0 && setToWindow("y")
		// 2. Fire callback
		onChange && onChange(dimension.value)
	}, [dimension, canvasRef])

	return { dimension, updateDimension, setCustom, options, toggleOrientation }
}

const DeviceToolbar: FC<T> = (props) => {
	const { context, onChange, canvasRef } = props
	const {
		dimension: {
			label,
			value: [x, y],
		},
		updateDimension,
		setCustom,
		options,
		toggleOrientation,
	} = useDimension(canvasRef, onChange)

	// Updating the values when typing is annoying, we don't want that.
	const [[inputX, inputY], setInputVal] = useState<Value>([x, y])

	React.useEffect(() => {
		setInputVal([x, y])
	}, [x, y])

	const handleBlur = (axis: "x" | "y") => {
		const newVal = [
			axis === "x" ? inputX : x,
			axis === "y" ? inputY : y,
		] as Value
		setCustom(newVal)
	}

	// Support hitting enter after typing
	const handleKeyDown = (key: string, axis: "x" | "y") =>
		key === "Enter" && handleBlur(axis)

	return (
		<div
			style={{
				textAlign: "center",
				padding: "4px 8px",
			}}
		>
			<div
				style={{
					padding: "0.5em 1em",
					borderRadius: "8px",
					backgroundColor: "#fff",
					boxShadow: "rgb(0 0 0 / 10%) 0px 0px 8px",
					display: "inline-flex",
					gap: "5px",
					marginBottom: "1em",
				}}
			>
				<span style={{ color: "rgb(100, 100, 100)" }}>
					Dimensions:{" "}
				</span>
				{/* Select */}
				<select
					value={label}
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
					value={inputX}
					onChange={(e) =>
						setInputVal([parseInt(e.target.value, 10), y])
					}
					onBlur={() => handleBlur("x")}
					onKeyDown={(e) => handleKeyDown(e.key, "x")}
				/>
				{/* Y */}
				<input
					value={inputY}
					onChange={(e) =>
						setInputVal([x, parseInt(e.target.value, 10)])
					}
					onBlur={() => handleBlur("y")}
					onKeyDown={(e) => handleKeyDown(e.key, "y")}
				/>
				{/* Orientation */}
				<button onClick={() => toggleOrientation()}>
					<Icon context={context} icon={"screen_rotation"} />
				</button>
			</div>
		</div>
	)
}

export default DeviceToolbar
