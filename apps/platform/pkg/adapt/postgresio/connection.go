package postgresio

import (
	"context"
	"errors"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/thecloudmasters/uesio/pkg/adapt"
)

type QueryAble interface {
	Exec(ctx context.Context, sql string, arguments ...interface{}) (pgconn.CommandTag, error)
	Query(ctx context.Context, sql string, optionsAndArgs ...interface{}) (pgx.Rows, error)
	QueryRow(ctx context.Context, sql string, optionsAndArgs ...interface{}) pgx.Row
	SendBatch(ctx context.Context, b *pgx.Batch) pgx.BatchResults
}

type Connection struct {
	metadata    *adapt.MetadataCache
	credentials *adapt.Credentials
	client      *pgxpool.Pool
	transaction pgx.Tx
	datasource  string
}

func (c *Connection) GetCredentials() *adapt.Credentials {
	return c.credentials
}

func (c *Connection) GetMetadata() *adapt.MetadataCache {
	return c.metadata
}

func (c *Connection) BeginTransaction() error {
	if c.transaction != nil {
		return errors.New("A transaction on this connection has already started")
	}
	client, err := connectForSave(c.credentials)
	if err != nil {
		return nil
	}
	txn, err := client.Begin(context.Background())
	if err != nil {
		return err
	}
	c.client = client
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

func (c *Connection) GetPGConn(ctx context.Context) (*pgxpool.Conn, error) {
	return c.client.Acquire(ctx)
}

func (c *Connection) GetDataSource() string {
	return c.datasource
}

func (a *Adapter) GetConnection(credentials *adapt.Credentials, metadata *adapt.MetadataCache, datasource string) (adapt.Connection, error) {

	client, err := connect(credentials)
	if err != nil {
		return nil, err
	}

	return &Connection{
		metadata:    metadata,
		credentials: credentials,
		client:      client,
		datasource:  datasource,
	}, nil
}
