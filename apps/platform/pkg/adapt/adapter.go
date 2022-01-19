package adapt

import (
	"errors"

	"github.com/thecloudmasters/uesio/pkg/configstore"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

const MAX_BATCH_SIZE = 100

// Adapter interface
type Adapter interface {
	Load([]*LoadOp, *MetadataCache, *Credentials, []string) error
	Save([]*SaveOp, *MetadataCache, *Credentials, []string) error
	Migrate(*Credentials) error
	GetAutonumber(*CollectionMetadata, *Credentials) (int, error)
}

var adapterMap = map[string]Adapter{}

// GetAdapter gets an adapter of a certain type
func GetAdapter(adapterType string, session *sess.Session) (Adapter, error) {
	mergedType, err := configstore.Merge(adapterType, session)
	if err != nil {
		return nil, err
	}
	adapter, ok := adapterMap[mergedType]
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
