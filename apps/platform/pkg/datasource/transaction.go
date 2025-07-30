package datasource

import (
	"context"

	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

func WithTransaction(ctx context.Context, session *sess.Session, existingConn wire.Connection, fn func(conn wire.Connection) error) error {
	conn, err := GetPlatformConnection(ctx, session, existingConn)
	if err != nil {
		return err
	}
	err = conn.BeginTransaction(ctx)
	if err != nil {
		return err
	}
	err = fn(conn)
	if err != nil {
		rbErr := conn.RollbackTransaction(ctx)
		if rbErr != nil {
			return rbErr
		}
		return err
	}
	return conn.CommitTransaction(ctx)
}

func WithTransactionResult[T any](ctx context.Context, session *sess.Session, existingConn wire.Connection, fn func(conn wire.Connection) (T, error)) (T, error) {
	var result T
	conn, err := GetPlatformConnection(ctx, session, existingConn)
	if err != nil {
		return result, err
	}
	err = conn.BeginTransaction(ctx)
	if err != nil {
		return result, err
	}
	result, err = fn(conn)
	if err != nil {
		rbErr := conn.RollbackTransaction(ctx)
		if rbErr != nil {
			return result, rbErr
		}
		return result, err
	}
	err = conn.CommitTransaction(ctx)
	if err != nil {
		return result, err
	}
	return result, nil
}
