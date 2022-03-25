package postgresio

import (
	"context"

	"github.com/jackc/pgconn"
	"github.com/jackc/pgx/v4"
	"github.com/jackc/pgx/v4/pgxpool"
	"github.com/thecloudmasters/uesio/pkg/adapt"
)

type QueryAble interface {
	Exec(ctx context.Context, sql string, arguments ...interface{}) (pgconn.CommandTag, error)
	Query(ctx context.Context, sql string, optionsAndArgs ...interface{}) (pgx.Rows, error)
	QueryRow(ctx context.Context, sql string, optionsAndArgs ...interface{}) pgx.Row
}

type Connection struct {
	metadata    *adapt.MetadataCache
	credentials *adapt.Credentials
	tokens      []string
	client      *pgxpool.Pool
	transaction pgx.Tx
	datasource  string
}

func (c *Connection) GetAutonumber(collectionMetadata *adapt.CollectionMetadata) (int, error) {
	return 0, nil
}

func (c *Connection) GetCredentials() *adapt.Credentials {
	return c.credentials
}

func (c *Connection) GetMetadata() *adapt.MetadataCache {
	return c.metadata
}

func (c *Connection) SetMetadata(metadata *adapt.MetadataCache) {
	c.metadata = metadata
}

func (c *Connection) BeginTransaction() error {
	txn, err := c.client.Begin(context.Background())
	if err != nil {
		return err
	}
	c.transaction = txn
	return nil
}
func (c *Connection) CommitTransaction() error {
	if c.transaction != nil {
		return c.transaction.Commit(context.Background())
	}
	return nil
}

func (c *Connection) RollbackTransaction() error {
	if c.transaction != nil {
		return c.transaction.Rollback(context.Background())
	}
	return nil
}

func (c *Connection) GetClient() QueryAble {
	if c.transaction != nil {
		return c.transaction
	}
	return c.client
}

func (c *Connection) GetDataSource() string {
	return c.datasource
}

// Load function
func (a *Adapter) GetConnection(credentials *adapt.Credentials, metadata *adapt.MetadataCache, datasource string, tokens []string) (adapt.Connection, error) {

	client, err := connect(credentials)
	if err != nil {
		return nil, err
	}

	return &Connection{
		metadata:    metadata,
		credentials: credentials,
		tokens:      tokens,
		client:      client,
		datasource:  datasource,
	}, nil
}
