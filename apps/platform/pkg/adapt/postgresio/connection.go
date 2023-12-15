package postgresio

import (
	"context"
	"errors"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

type QueryAble interface {
	Exec(ctx context.Context, sql string, arguments ...interface{}) (pgconn.CommandTag, error)
	Query(ctx context.Context, sql string, optionsAndArgs ...interface{}) (pgx.Rows, error)
	QueryRow(ctx context.Context, sql string, optionsAndArgs ...interface{}) pgx.Row
	SendBatch(ctx context.Context, b *pgx.Batch) pgx.BatchResults
}

type Connection struct {
	metadata    *wire.MetadataCache
	credentials *wire.Credentials
	client      *pgxpool.Pool
	transaction pgx.Tx
	datasource  string
	ctx         context.Context
}

func (c *Connection) Context() context.Context {
	return c.ctx
}

func (c *Connection) GetCredentials() *wire.Credentials {
	return c.credentials
}

func (c *Connection) GetMetadata() *wire.MetadataCache {
	return c.metadata
}

func (c *Connection) BeginTransaction() error {
	if c.transaction != nil {
		return errors.New("A transaction on this connection has already started")
	}
	client, err := connectForSave(c.ctx, c.credentials)
	if err != nil {
		return nil
	}
	txn, err := client.Begin(c.ctx)
	if err != nil {
		return err
	}
	c.client = client
	c.transaction = txn
	return nil
}
func (c *Connection) CommitTransaction() error {
	if c.transaction != nil {
		return c.transaction.Commit(c.ctx)
	}
	return nil
}

func (c *Connection) RollbackTransaction() error {
	if c.transaction != nil {
		return c.transaction.Rollback(c.ctx)
	}
	return nil
}

func (c *Connection) GetClient() QueryAble {
	if c.transaction != nil {
		return c.transaction
	}
	return c.client
}

func (c *Connection) GetPGConn() (*pgxpool.Conn, error) {
	return c.client.Acquire(c.ctx)
}

func (c *Connection) GetDataSource() string {
	return c.datasource
}

func (a *Adapter) GetConnection(ctx context.Context, credentials *wire.Credentials, metadata *wire.MetadataCache, datasource string) (wire.Connection, error) {

	client, err := connect(ctx, credentials)
	if err != nil {
		return nil, err
	}

	return &Connection{
		metadata:    metadata,
		credentials: credentials,
		client:      client,
		datasource:  datasource,
		ctx:         ctx,
	}, nil
}
