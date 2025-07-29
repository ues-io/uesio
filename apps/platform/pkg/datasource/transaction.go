package datasource

import (
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

func WithTransaction(session *sess.Session, existingConn wire.Connection, fn func(conn wire.Connection) error) error {
	conn, err := GetPlatformConnection(session, existingConn)
	if err != nil {
		return err
	}
	err = conn.BeginTransaction(session.Context())
	if err != nil {
		return err
	}
	err = fn(conn)
	if err != nil {
		rbErr := conn.RollbackTransaction(session.Context())
		if rbErr != nil {
			return rbErr
		}
		return err
	}
	return conn.CommitTransaction(session.Context())
}

func WithTransactionResult[T any](session *sess.Session, existingConn wire.Connection, fn func(conn wire.Connection) (T, error)) (T, error) {
	var result T
	conn, err := GetPlatformConnection(session, existingConn)
	if err != nil {
		return result, err
	}
	err = conn.BeginTransaction(session.Context())
	if err != nil {
		return result, err
	}
	result, err = fn(conn)
	if err != nil {
		rbErr := conn.RollbackTransaction(session.Context())
		if rbErr != nil {
			return result, rbErr
		}
		return result, err
	}
	err = conn.CommitTransaction(session.Context())
	if err != nil {
		return result, err
	}
	return result, nil
}
