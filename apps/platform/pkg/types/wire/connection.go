package wire

import (
	"context"

	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/types/migrations"
)

type Connection interface {
	Load(context.Context, *LoadOp, *sess.Session) error
	Save(context.Context, *SaveOp, *sess.Session) error
	SetRecordAccessTokens(context.Context, *SaveOp, *sess.Session) error
	GetRecordAccessTokens(context.Context, string, *sess.Session) ([]string, error)
	Migrate(ctx context.Context, options *migrations.MigrateOptions) error
	TruncateTenantData(ctx context.Context, tenantID string) error
	GetCredentials(context.Context) *Credentials
	GetDataSource(context.Context) string
	BeginTransaction(context.Context) error
	CommitTransaction(context.Context) error
	RollbackTransaction(context.Context) error
	Publish(ctx context.Context, channelName, payload string) error
	Subscribe(ctx context.Context, channelName string, handler func(ctx context.Context, payload string)) error
}
