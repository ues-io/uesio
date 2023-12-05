package datasource

import (
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

var ID_FIELD_DEF = meta.Field{
	BundleableBase: meta.BundleableBase{
		Name:      "id",
		Namespace: "uesio/core",
	},
	ReadOnly: true,
	Type:     "TEXT",
	Label:    "Id",
}

var UNIQUE_KEY_FIELD_DEF = meta.Field{
	BundleableBase: meta.BundleableBase{
		Name:      "uniquekey",
		Namespace: "uesio/core",
	},
	ReadOnly: true,
	Type:     "TEXT",
	Label:    "Unique Key",
}

var OWNER_FIELD_DEF = meta.Field{
	BundleableBase: meta.BundleableBase{
		Name:      "owner",
		Namespace: "uesio/core",
	},
	ReadOnly:     false,
	Type:         "USER",
	Label:        "Owner",
	AutoPopulate: "CREATE",
}

var CREATEDBY_FIELD_DEF = meta.Field{
	BundleableBase: meta.BundleableBase{
		Name:      "createdby",
		Namespace: "uesio/core",
	},
	ReadOnly:     true,
	Type:         "USER",
	Label:        "Created By",
	AutoPopulate: "CREATE",
}

var UPDATEDBY_FIELD_DEF = meta.Field{
	BundleableBase: meta.BundleableBase{
		Name:      "updatedby",
		Namespace: "uesio/core",
	},
	ReadOnly:     true,
	Type:         "USER",
	Label:        "Updated By",
	AutoPopulate: "UPDATE",
}

var CREATEDAT_FIELD_DEF = meta.Field{
	BundleableBase: meta.BundleableBase{
		Name:      "createdat",
		Namespace: "uesio/core",
	},
	ReadOnly:     true,
	Type:         "TIMESTAMP",
	Label:        "Created At",
	AutoPopulate: "CREATE",
}

var UPDATEDAT_FIELD_DEF = meta.Field{
	BundleableBase: meta.BundleableBase{
		Name:      "updatedat",
		Namespace: "uesio/core",
	},
	ReadOnly:     true,
	Type:         "TIMESTAMP",
	Label:        "Updated At",
	AutoPopulate: "UPDATE",
}

var COLLECTION_FIELD_DEF = meta.Field{
	BundleableBase: meta.BundleableBase{
		Name:      "collection",
		Namespace: "uesio/core",
	},
	ReadOnly: true,
	Type:     "METADATA",
	MetadataFieldMetadata: &meta.MetadataFieldMetadata{
		Type: "COLLECTION",
	},
	Label: "Collection",
}

var BUILTIN_FIELDS_MAP = map[string]meta.Field{
	wire.ID_FIELD:         ID_FIELD_DEF,
	wire.UNIQUE_KEY_FIELD: UNIQUE_KEY_FIELD_DEF,
	wire.OWNER_FIELD:      OWNER_FIELD_DEF,
	wire.CREATED_BY_FIELD: CREATEDBY_FIELD_DEF,
	wire.UPDATED_BY_FIELD: UPDATEDBY_FIELD_DEF,
	wire.CREATED_AT_FIELD: CREATEDAT_FIELD_DEF,
	wire.UPDATED_AT_FIELD: UPDATEDAT_FIELD_DEF,
	wire.COLLECTION_FIELD: COLLECTION_FIELD_DEF,
}

var BUILTIN_FIELD_KEYS = []string{
	wire.ID_FIELD,
	wire.UNIQUE_KEY_FIELD,
	wire.OWNER_FIELD,
	wire.CREATED_BY_FIELD,
	wire.UPDATED_BY_FIELD,
	wire.CREATED_AT_FIELD,
	wire.UPDATED_AT_FIELD,
	wire.COLLECTION_FIELD,
}

func AddAllBuiltinFields(fields meta.BundleableGroup, collectionKey string) {
	for _, key := range BUILTIN_FIELD_KEYS {
		field, _ := GetBuiltinField(key, collectionKey)
		fields.AddItem(&field)
	}
}

func GetBuiltinField(key string, collectionKey string) (meta.Field, bool) {
	field, ok := BUILTIN_FIELDS_MAP[key]
	if !ok {
		return field, false
	}
	field.CollectionRef = collectionKey
	return field, true
}
