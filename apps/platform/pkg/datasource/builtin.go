package datasource

import (
	"github.com/thecloudmasters/uesio/pkg/meta"
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
	ReadOnly:     true,
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

var BUILTIN_FIELDS_MAP = map[string]meta.Field{
	"uesio/core.id":        ID_FIELD_DEF,
	"uesio/core.uniquekey": UNIQUE_KEY_FIELD_DEF,
	"uesio/core.owner":     OWNER_FIELD_DEF,
	"uesio/core.createdby": CREATEDBY_FIELD_DEF,
	"uesio/core.updatedby": UPDATEDBY_FIELD_DEF,
	"uesio/core.createdat": CREATEDAT_FIELD_DEF,
	"uesio/core.updatedat": UPDATEDAT_FIELD_DEF,
}

func AddAllBuiltinFields(fields meta.BundleableGroup) {
	fields.AddItem(&ID_FIELD_DEF)
	fields.AddItem(&UNIQUE_KEY_FIELD_DEF)
	fields.AddItem(&OWNER_FIELD_DEF)
	fields.AddItem(&CREATEDBY_FIELD_DEF)
	fields.AddItem(&UPDATEDBY_FIELD_DEF)
	fields.AddItem(&CREATEDAT_FIELD_DEF)
	fields.AddItem(&UPDATEDAT_FIELD_DEF)
}

func GetBuiltinField(key string) (meta.Field, bool) {
	field, ok := BUILTIN_FIELDS_MAP[key]
	if !ok {
		return field, false
	}
	return field, true
}
