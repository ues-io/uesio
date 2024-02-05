package datasource

import (
	"github.com/thecloudmasters/uesio/pkg/constant/commonfields"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

func GetCommonCollectionMetadata() *wire.CollectionMetadata {
	return &wire.CollectionMetadata{
		Name:        "common",
		Namespace:   "uesio/core",
		Label:       "Common",
		PluralLabel: "Common",
		Fields:      map[string]*wire.FieldMetadata{},
		Type:        "DYNAMIC",
		NameField:   commonfields.UniqueKey,
	}
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
	commonfields.Id:         ID_FIELD_DEF,
	commonfields.UniqueKey:  UNIQUE_KEY_FIELD_DEF,
	commonfields.Owner:      OWNER_FIELD_DEF,
	commonfields.CreatedBy:  CREATEDBY_FIELD_DEF,
	commonfields.UpdatedBy:  UPDATEDBY_FIELD_DEF,
	commonfields.CreatedAt:  CREATEDAT_FIELD_DEF,
	commonfields.UpdatedAt:  UPDATEDAT_FIELD_DEF,
	commonfields.Collection: COLLECTION_FIELD_DEF,
}

var BUILTIN_FIELD_KEYS = []string{
	commonfields.Id,
	commonfields.UniqueKey,
	commonfields.Owner,
	commonfields.CreatedBy,
	commonfields.UpdatedBy,
	commonfields.CreatedAt,
	commonfields.UpdatedAt,
	commonfields.Collection,
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
