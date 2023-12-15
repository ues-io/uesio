package wire

import (
	"context"

	"github.com/thecloudmasters/uesio/pkg/sess"
)

type Connection interface {
	Context() context.Context
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
	Publish(channelName, payload string) error
	Subscribe(channelName string, handler func(payload string)) error
}
