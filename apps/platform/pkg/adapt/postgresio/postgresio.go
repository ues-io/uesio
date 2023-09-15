package postgresio

import (
	"context"
	"errors"
	"fmt"
	"sync"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/thecloudmasters/uesio/pkg/adapt"
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

func connect(credentials *adapt.Credentials) (*pgxpool.Pool, error) {
	return checkPoolCache(clientPool, credentials)
}

func connectForSave(credentials *adapt.Credentials) (*pgxpool.Pool, error) {
	return checkPoolCache(saveClientPool, credentials)
}

func checkPoolCache(cache map[string]*pgxpool.Pool, credentials *adapt.Credentials) (*pgxpool.Pool, error) {
	hash := credentials.GetHash()
	// Check the pool for a client
	lock.RLock()
	client, ok := cache[hash]
	lock.RUnlock()
	if ok {
		return client, nil
	}
	pool, err := getConnection(credentials, hash)
	if err != nil {
		return nil, err
	}

	lock.Lock()
	defer lock.Unlock()

	cache[hash] = pool
	return pool, nil
}

func getConnection(credentials *adapt.Credentials, hash string) (*pgxpool.Pool, error) {
	host, ok := (*credentials)["host"]
	if !ok {
		return nil, errors.New("No host provided in credentials")
	}

	port, ok := (*credentials)["port"]
	if !ok {
		port = "5432"
	}

	user, ok := (*credentials)["user"]
	if !ok {
		return nil, errors.New("No user provided in credentials")
	}

	password, ok := (*credentials)["password"]
	if !ok {
		return nil, errors.New("No password provided in credentials")
	}

	dbname, ok := (*credentials)["database"]
	if !ok {
		return nil, errors.New("No database provided in credentials")
	}

	psqlInfo := fmt.Sprintf("host=%s port=%s user=%s "+"password=%s dbname=%s sslmode=disable", host, port, user, password, dbname)

	config, err := pgxpool.ParseConfig(psqlInfo)
	if err != nil {
		return nil, err
	}
	config.ConnConfig.Tracer = &Tracer{}
	db, err := pgxpool.NewWithConfig(context.Background(), config)
	if err != nil {
		return nil, err
	}

	err = db.Ping(context.Background())
	if err != nil {
		return nil, err
	}

	return db, nil
}
