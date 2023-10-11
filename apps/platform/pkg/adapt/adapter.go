package adapt

import (
	"errors"

	"github.com/thecloudmasters/uesio/pkg/sess"
)

const MAX_LOAD_BATCH_SIZE = 500
const MAX_SAVE_BATCH_SIZE = 500
const MAX_ITER_REF_GROUP = 10

type Adapter interface {
	// GetCredentials returns the unique key of the credentials metadata record to use for this adapter
	GetCredentials() string
	// GetConnection returns a connection to use for this adapter
	GetConnection(*Credentials, *MetadataCache, string) (Connection, error)
}

type Connection interface {
	Load(*LoadOp, *sess.Session) error
	Save(*SaveOp, *sess.Session) error
	SetRecordAccessTokens(*SaveOp, *sess.Session) error
	GetRecordAccessTokens(string, *sess.Session) ([]string, error)
	Migrate() error
	TruncateTenantData(tenantID string) error
	GetAutonumber(*CollectionMetadata, *sess.Session) (int, error)
	GetMetadata() *MetadataCache
	GetCredentials() *Credentials
	GetDataSource() string
	BeginTransaction() error
	CommitTransaction() error
	RollbackTransaction() error
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

func RegisterAdapter(name string, adapter Adapter) {
	adapterMap[name] = adapter
}

func GetStringWithDefault(field string, defaultField string) string {
	if field != "" {
		return field
	}
	return defaultField
}
