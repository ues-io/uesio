package datasource

import (
	"fmt"

	"github.com/gomodule/redigo/redis"
	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/cache"
)

func getAutonumber(insertCount int, adapter adapt.Adapter, collectionMetadata *adapt.CollectionMetadata, credentials *adapt.Credentials) (int, error) {
	// Connect to redis and increment the counter
	conn := cache.GetRedisConn()
	defer conn.Close()
	key := fmt.Sprintf("autonumber:%s:%s", collectionMetadata.GetFullName(), credentials.GetTenantID())
	keys, err := redis.Int(conn.Do("EXISTS", key))
	if err != nil {
		return 0, fmt.Errorf("Error Getting Autonumber key: " + err.Error())
	}

	if keys == 0 {
		// no key present in cache, we'll have to check the db
		autonumber, err := adapter.GetAutonumber(collectionMetadata, credentials)
		if err != nil {
			return 0, fmt.Errorf("Error Getting Autonumber from DB: " + err.Error())
		}
		_, err = conn.Do("SET", key, autonumber+1)
		if err != nil {
			return 0, fmt.Errorf("Error Setting Autonumber from DB: " + err.Error())
		}
	}

	end, err := redis.Int(conn.Do("INCRBY", key, insertCount))
	if err != nil {
		return 0, fmt.Errorf("Error Getting Autonumber value: " + err.Error())
	}
	return end - insertCount, nil
}
