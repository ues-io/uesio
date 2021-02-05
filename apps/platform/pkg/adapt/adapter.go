package adapt

import (
	"errors"
)

// Adapter interface
type Adapter interface {
	Load([]LoadOp, *MetadataCache, *Credentials) error
	Save([]SaveOp, *MetadataCache, *Credentials) error
	Migrate(*MetadataCache, *Credentials) error
}

var adapterMap = map[string]Adapter{}

// GetAdapter gets an adapter of a certain type
func GetAdapter(adapterType string) (Adapter, error) {
	adapter, ok := adapterMap[adapterType]
	if !ok {
		return nil, errors.New("No adapter found of this type: " + adapterType)
	}
	return adapter, nil
}

// RegisterAdapter function
func RegisterAdapter(name string, adapter Adapter) {
	adapterMap[name] = adapter
}

func getStringWithDefault(field string, defaultField string) string {
	if field != "" {
		return field
	}
	return defaultField
}

type DataFunc func(fieldMetadata *FieldMetadata) (interface{}, error)

type FieldNameFunc func(*FieldMetadata) (string, error)
