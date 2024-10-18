package datasource

import (
	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

func WithTransaction(conn wire.Connection, fn func(conn wire.Connection) error) error {
	err := conn.BeginTransaction()
	if err != nil {
		return err
	}
	err = fn(conn)
	if err != nil {
		rbErr := conn.RollbackTransaction()
		if rbErr != nil {
			return rbErr
		}
		return err
	}
	return conn.CommitTransaction()
}

func WithTransactionResult[T any](conn wire.Connection, fn func(conn wire.Connection) (T, error)) (T, error) {
	var result T
	err := conn.BeginTransaction()
	if err != nil {
		return result, err
	}
	result, err = fn(conn)
	if err != nil {
		rbErr := conn.RollbackTransaction()
		if rbErr != nil {
			return result, rbErr
		}
		return result, err
	}
	err = conn.CommitTransaction()
	if err != nil {
		return result, err
	}
	return result, nil
}
