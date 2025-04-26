package postgresio

import (
	"context"
	"errors"
	"sync"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgconn"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

type QueryAble interface {
	Exec(ctx context.Context, sql string, arguments ...any) (pgconn.CommandTag, error)
	Query(ctx context.Context, sql string, optionsAndArgs ...any) (pgx.Rows, error)
	QueryRow(ctx context.Context, sql string, optionsAndArgs ...any) pgx.Row
	SendBatch(ctx context.Context, b *pgx.Batch) pgx.BatchResults
}

type Connection struct {
	credentials *wire.Credentials
	client      *pgxpool.Pool
	transaction pgx.Tx
	datasource  string
	ctx         context.Context
	mux         *sync.Mutex
}

func (c *Connection) Context() context.Context {
	return c.ctx
}

func (c *Connection) GetCredentials() *wire.Credentials {
	return c.credentials
}

func (c *Connection) BeginTransaction() error {
	if c.transaction != nil {
		return errors.New("a transaction on this connection has already started")
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

func (c *Connection) SendBatch(batch *pgx.Batch) error {
	c.mux.Lock()
	defer c.mux.Unlock()
	results := c.GetClient().SendBatch(c.ctx, batch)

	execCount := batch.Len()
	for range execCount {
		_, err := results.Exec()
		if err != nil {
			results.Close()
			return err
		}
	}
	return results.Close()
}

func (c *Connection) Query(fn func(scan func(dest ...any) error, index int) (bool, error), query string, values ...any) error {
	c.mux.Lock()
	defer c.mux.Unlock()
	rows, err := c.GetClient().Query(c.ctx, query, values...)
	if err != nil {
		return err
	}
	defer rows.Close()
	index := 0
	for rows.Next() {
		done, err := fn(rows.Scan, index)
		if err != nil {
			return err
		}
		if done {
			break
		}
		index++
	}
	return rows.Err()
}

func (a *Adapter) GetConnection(ctx context.Context, credentials *wire.Credentials, datasource string) (wire.Connection, error) {

	client, err := connect(ctx, credentials)
	if err != nil {
		return nil, err
	}

	return &Connection{
		credentials: credentials,
		client:      client,
		datasource:  datasource,
		ctx:         ctx,
		mux:         &sync.Mutex{},
	}, nil
}
