package adapt

import (
	"errors"

	"github.com/thecloudmasters/uesio/pkg/configstore"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

const MAX_LOAD_BATCH_SIZE = 100
const MAX_SAVE_BATCH_SIZE = 100
const MAX_ITER_REF_GROUP = 10

// Adapter interface
type Adapter interface {
	GetConnection(*Credentials, *MetadataCache, string, []string) (Connection, error)
}

type Connection interface {
	Load(*LoadOp) error
	Save(*SaveOp) error
	Migrate() error
	GetAutonumber(*CollectionMetadata) (int, error)
	GetMetadata() *MetadataCache
	SetMetadata(*MetadataCache)
	GetCredentials() *Credentials
	GetDataSource() string
	BeginTransaction() error
	CommitTransaction() error
	RollbackTransaction() error
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
		return nil, errors.New("No adapter found of this type: " + mergedType)
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
