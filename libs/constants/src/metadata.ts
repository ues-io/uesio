const metadata = {
	COLLECTION: 'collections',
	FIELD: 'fields',
	VIEW: 'views',
	DATASOURCE: 'datasources',
	SECRET: 'secrets',
};

type MetadataType = keyof typeof metadata;

export { metadata, MetadataType };
