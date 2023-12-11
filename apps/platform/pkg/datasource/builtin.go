package datasource

import (
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

var COMMON_COLLECTION_METADATA = wire.CollectionMetadata{
	Name:        "common",
	Namespace:   "uesio/core",
	Label:       "Common",
	PluralLabel: "Common",
	Fields:      map[string]*wire.FieldMetadata{},
	Type:        "DYNAMIC",
}

var ID_FIELD_DEF = meta.Field{
	BundleableBase: meta.BundleableBase{
		Name:      "id",
		Namespace: "uesio/core",
		Label:     "Id",
	},
	ReadOnly: true,
	Type:     "TEXT",
}

var UNIQUE_KEY_FIELD_DEF = meta.Field{
	BundleableBase: meta.BundleableBase{
		Name:      "uniquekey",
		Namespace: "uesio/core",
		Label:     "Unique Key",
	},
	ReadOnly: true,
	Type:     "TEXT",
}

var OWNER_FIELD_DEF = meta.Field{
	BundleableBase: meta.BundleableBase{
		Name:      "owner",
		Namespace: "uesio/core",
		Label:     "Owner",
	},
	ReadOnly:     false,
	Type:         "USER",
	AutoPopulate: "CREATE",
}

var CREATEDBY_FIELD_DEF = meta.Field{
	BundleableBase: meta.BundleableBase{
		Name:      "createdby",
		Namespace: "uesio/core",
		Label:     "Created By",
	},
	ReadOnly:     true,
	Type:         "USER",
	AutoPopulate: "CREATE",
}

var UPDATEDBY_FIELD_DEF = meta.Field{
	BundleableBase: meta.BundleableBase{
		Name:      "updatedby",
		Namespace: "uesio/core",
		Label:     "Updated By",
	},
	ReadOnly:     true,
	Type:         "USER",
	AutoPopulate: "UPDATE",
}

var CREATEDAT_FIELD_DEF = meta.Field{
	BundleableBase: meta.BundleableBase{
		Name:      "createdat",
		Namespace: "uesio/core",
		Label:     "Created At",
	},
	ReadOnly:     true,
	Type:         "TIMESTAMP",
	AutoPopulate: "CREATE",
}

var UPDATEDAT_FIELD_DEF = meta.Field{
	BundleableBase: meta.BundleableBase{
		Name:      "updatedat",
		Namespace: "uesio/core",
		Label:     "Updated At",
	},
	ReadOnly:     true,
	Type:         "TIMESTAMP",
	AutoPopulate: "UPDATE",
}

var COLLECTION_FIELD_DEF = meta.Field{
	BundleableBase: meta.BundleableBase{
		Name:      "collection",
		Namespace: "uesio/core",
		Label:     "Collection",
	},
	ReadOnly: true,
	Type:     "METADATA",
	MetadataFieldMetadata: &meta.MetadataFieldMetadata{
		Type: "COLLECTION",
	},
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
