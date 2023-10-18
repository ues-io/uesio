import { PlainCollection } from "../../src/bands/collection/types"

export const NS = "ben/planets"

export const getExoplanetCollection = (): PlainCollection => ({
	name: "exoplanet",
	namespace: NS,
	createable: true,
	accessible: true,
	updateable: true,
	deleteable: true,
	nameField: `ben/planets.name`,
	fields: {
		"ben/planets.name": {
			name: "name",
			namespace: NS,
			createable: true,
			accessible: true,
			updateable: true,
			type: "TEXT",
			label: "Name",
		},
		"ben/planets.galaxy": {
			name: "galaxy",
			namespace: NS,
			createable: true,
			accessible: true,
			updateable: true,
			type: "REFERENCE",
			reference: {
				collection: "ben/planets.galaxy",
			},
			label: "Galaxy",
		},
		"ben/planets.location": {
			name: "location",
			namespace: NS,
			createable: true,
			accessible: true,
			updateable: true,
			type: "STRUCT",
			subfields: {
				x: {
					name: "x",
					namespace: "",
					createable: true,
					accessible: true,
					updateable: true,
					type: "TEXT",
					label: "X",
				},
				y: {
					name: "y",
					namespace: "",
					createable: true,
					accessible: true,
					updateable: true,
					type: "TEXT",
					label: "Y",
				},
				z: {
					name: "z",
					namespace: "",
					createable: true,
					accessible: true,
					updateable: true,
					type: "TEXT",
					label: "Z",
				},
			},
			label: "Galaxy",
		},
	},
	label: "Exoplanet",
	pluralLabel: "Exoplanets",
})

export const getGalaxyCollection = (): PlainCollection => ({
	name: "galaxy",
	namespace: NS,
	createable: true,
	accessible: true,
	updateable: true,
	deleteable: true,
	nameField: `ben/planets.name`,
	fields: {
		"ben/planets.name": {
			name: "name",
			namespace: NS,
			createable: true,
			accessible: true,
			updateable: true,
			type: "TEXT",
			label: "Name",
		},
	},
	label: "Galaxy",
	pluralLabel: "Galaxies",
})

export const getCollectionSlice = () => [
	getExoplanetCollection(),
	getGalaxyCollection(),
]
