package datasource

import "github.com/thecloudmasters/uesio/pkg/adapt"

var BUILTIN_FIELDS = [...]adapt.FieldMetadata{ID_FIELD_METADATA, UNIQUE_KEY_FIELD_METADATA, OWNER_FIELD_METADATA, CREATEDBY_FIELD_METADATA, UPDATEDBY_FIELD_METADATA, CREATEDAT_FIELD_METADATA, UPDATEDAT_FIELD_METADATA}

var ID_FIELD_METADATA = adapt.FieldMetadata{
	Name:       "id",
	Namespace:  "uesio/core",
	Createable: false,
	Accessible: true,
	Updateable: false,
	Type:       "TEXT",
	Label:      "Id",
}

var UNIQUE_KEY_FIELD_METADATA = adapt.FieldMetadata{
	Name:       "uniquekey",
	Namespace:  "uesio/core",
	Createable: false,
	Accessible: true,
	Updateable: false,
	Type:       "TEXT",
	Label:      "Unique Key",
}

var OWNER_FIELD_METADATA = adapt.FieldMetadata{
	Name:         "owner",
	Namespace:    "uesio/core",
	Createable:   false,
	Accessible:   true,
	Updateable:   false,
	Type:         "USER",
	Label:        "Owner",
	AutoPopulate: "CREATE",
}

var CREATEDBY_FIELD_METADATA = adapt.FieldMetadata{
	Name:         "createdby",
	Namespace:    "uesio/core",
	Createable:   false,
	Accessible:   true,
	Updateable:   false,
	Type:         "USER",
	Label:        "Created By",
	AutoPopulate: "CREATE",
}

var UPDATEDBY_FIELD_METADATA = adapt.FieldMetadata{
	Name:         "updatedby",
	Namespace:    "uesio/core",
	Createable:   false,
	Accessible:   true,
	Updateable:   false,
	Type:         "USER",
	Label:        "Updated By",
	AutoPopulate: "UPDATE",
}

var CREATEDAT_FIELD_METADATA = adapt.FieldMetadata{
	Name:         "createdat",
	Namespace:    "uesio/core",
	Createable:   false,
	Accessible:   true,
	Updateable:   false,
	Type:         "TIMESTAMP",
	Label:        "Created At",
	AutoPopulate: "CREATE",
}

var UPDATEDAT_FIELD_METADATA = adapt.FieldMetadata{
	Name:         "updatedat",
	Namespace:    "uesio/core",
	Createable:   false,
	Accessible:   true,
	Updateable:   false,
	Type:         "TIMESTAMP",
	Label:        "Updated At",
	AutoPopulate: "UPDATE",
}

var DYNAMIC_COLLECTION_FIELD = adapt.FieldMetadata{
	Name:       "dynamiccollection",
	Namespace:  "uesio/core",
	Createable: false,
	Accessible: true,
	Updateable: false,
	Type:       "TEXT",
	Label:      "Dynamic Collection",
}

func addAllBuiltinFields(collectionMetadata *adapt.CollectionMetadata) {
	collectionMetadata.SetField(&ID_FIELD_METADATA)
	collectionMetadata.SetField(&UNIQUE_KEY_FIELD_METADATA)
	collectionMetadata.SetField(&OWNER_FIELD_METADATA)
	collectionMetadata.SetField(&CREATEDBY_FIELD_METADATA)
	collectionMetadata.SetField(&UPDATEDBY_FIELD_METADATA)
	collectionMetadata.SetField(&CREATEDAT_FIELD_METADATA)
	collectionMetadata.SetField(&UPDATEDAT_FIELD_METADATA)
	return
}

func addBuiltinFields(collectionMetadata *adapt.CollectionMetadata, requestedFields FieldsMap) {
	collectionMetadata.SetField(&ID_FIELD_METADATA)
	collectionMetadata.SetField(&UNIQUE_KEY_FIELD_METADATA)
	_, ok := requestedFields[adapt.OWNER_FIELD]
	if ok {
		collectionMetadata.SetField(&OWNER_FIELD_METADATA)
	}
	_, ok = requestedFields["uesio/core.createdby"]
	if ok {
		collectionMetadata.SetField(&CREATEDBY_FIELD_METADATA)
	}
	_, ok = requestedFields["uesio/core.updatedby"]
	if ok {
		collectionMetadata.SetField(&UPDATEDBY_FIELD_METADATA)
	}
	_, ok = requestedFields["uesio/core.createdat"]
	if ok {
		collectionMetadata.SetField(&CREATEDAT_FIELD_METADATA)
	}
	_, ok = requestedFields["uesio/core.updatedat"]
	if ok {
		collectionMetadata.SetField(&UPDATEDAT_FIELD_METADATA)
	}

	return
}
