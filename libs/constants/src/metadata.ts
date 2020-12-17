const METADATA = {
	COLLECTION: 'collections',
	FIELD: 'fields',
	VIEW: 'views',
	DATASOURCE: 'datasources',
	SECRET: 'secrets',
	THEME: 'themes',
	SELECTLIST: 'selectlists',
};

type MetadataType = keyof typeof METADATA;

export { METADATA, MetadataType };
