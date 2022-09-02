package datasource

import (
	"fmt"
	"time"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/cache"
)

func RegisterUsageEvent(actiontype, user, metadatatype, metadataname string, connection adapt.Connection) error {

	if user == "uesio" {
		return nil
	}

	if user == "" {
		user = "GUEST"
	}

	credentials := connection.GetCredentials()
	// Connect to redis and increment the counter
	conn := cache.GetRedisConn()
	defer conn.Close()

	currentTime := time.Now()
	key := fmt.Sprintf("event:%s:%s:%s:%s:%s:%s", credentials.GetTenantID(), user, currentTime.Format("2006-01-02"), actiontype, metadatatype, metadataname)

	_, err := conn.Do("SADD", "USAGE_KEYS", key)
	if err != nil {
		return fmt.Errorf("Error Registering Usage Event: " + err.Error())
	}

	_, err = conn.Do("INCR", key)
	if err != nil {
		return fmt.Errorf("Error Registering Usage Event: " + err.Error())
	}

	return nil
}
