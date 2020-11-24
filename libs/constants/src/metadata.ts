const METADATA = {
	COLLECTION: 'collections',
	FIELD: 'fields',
	VIEW: 'views',
	DATASOURCE: 'datasources',
	SECRET: 'secrets',
	THEME: 'themes',
};

type MetadataType = keyof typeof METADATA;

export { METADATA, MetadataType };
