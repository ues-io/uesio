package postgresio

import (
	"context"
	"fmt"
	"sync"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"

	"github.com/thecloudmasters/uesio/pkg/types/wire"
)

type Adapter struct {
	Credentials string
}

func (a *Adapter) GetCredentials() string {
	return a.Credentials
}

type Tracer struct{}

func (t *Tracer) TraceQueryStart(ctx context.Context, conn *pgx.Conn, data pgx.TraceQueryStartData) context.Context {
	//fmt.Println("-- MAKING SQL QUERY --")
	//fmt.Println(data.SQL)
	//fmt.Println(data.Args)
	return ctx
}

func (t *Tracer) TraceQueryEnd(ctx context.Context, conn *pgx.Conn, data pgx.TraceQueryEndData) {
	//fmt.Println("-- DONE MAKING SQL QUERY --")
}

func (t *Tracer) TraceBatchStart(ctx context.Context, conn *pgx.Conn, data pgx.TraceBatchStartData) context.Context {
	return ctx
}

func (t *Tracer) TraceBatchQuery(ctx context.Context, conn *pgx.Conn, data pgx.TraceBatchQueryData) {
	//fmt.Println("-- MAKING BATCHED SQL QUERY --")
	//fmt.Println(data.SQL)
	//fmt.Println(data.Args)
	//fmt.Println(data.Err)

}
func (t *Tracer) TraceBatchEnd(ctx context.Context, conn *pgx.Conn, data pgx.TraceBatchEndData) {
	//fmt.Println("-- DONE MAKING BATCHED SQL QUERY --")

}

// We're creating two different connection pool pools.
// One for loads that are not part of a transaction,
// and the other pool for save transactions.
// This eliminates an resource contention issue when
// the pools get full. They should not be dependent on
// each other to finish.
var clientPool = map[string]*pgxpool.Pool{}
var saveClientPool = map[string]*pgxpool.Pool{}
var lock sync.RWMutex

func connect(ctx context.Context, credentials *wire.Credentials) (*pgxpool.Pool, error) {
	return checkPoolCache(ctx, clientPool, credentials)
}

func connectForSave(ctx context.Context, credentials *wire.Credentials) (*pgxpool.Pool, error) {
	return checkPoolCache(ctx, saveClientPool, credentials)
}

func checkPoolCache(ctx context.Context, cache map[string]*pgxpool.Pool, credentials *wire.Credentials) (*pgxpool.Pool, error) {
	hash := credentials.GetHash()
	// Check the pool for a client
	lock.RLock()
	client, ok := cache[hash]
	lock.RUnlock()
	if ok {
		return client, nil
	}
	pool, err := getConnection(ctx, credentials)
	if err != nil {
		return nil, err
	}

	lock.Lock()
	defer lock.Unlock()

	cache[hash] = pool
	return pool, nil
}

func getConnection(ctx context.Context, credentials *wire.Credentials) (*pgxpool.Pool, error) {
	host, err := credentials.GetRequiredEntry("host")
	if err != nil {
		return nil, err
	}

	port := credentials.GetEntry("port", "5432")

	user, err := credentials.GetRequiredEntry("username")
	if err != nil {
		return nil, err
	}

	password, err := credentials.GetRequiredEntry("password")
	if err != nil {
		return nil, err
	}

	dbname, err := credentials.GetRequiredEntry("database")
	if err != nil {
		return nil, err
	}

	sslmode, err := credentials.GetRequiredEntry("sslmode")
	if err != nil {
		return nil, err
	}

	psqlInfo := fmt.Sprintf("host=%s port=%s user=%s "+"password=%s dbname=%s sslmode=%s", host, port, user, password, dbname, sslmode)

	config, err := pgxpool.ParseConfig(psqlInfo)
	if err != nil {
		return nil, err
	}
	config.ConnConfig.Tracer = &Tracer{}
	db, err := pgxpool.NewWithConfig(ctx, config)
	if err != nil {
		return nil, err
	}

	err = db.Ping(ctx)
	if err != nil {
		return nil, err
	}

	return db, nil
}
