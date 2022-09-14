package datasource

import (
	"fmt"
	"time"

	"github.com/thecloudmasters/uesio/pkg/cache"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

func RegisterUsageEvent(actiontype, metadatatype, metadataname string, session *sess.Session) error {

	user := session.GetUserInfo()

	if user.Username == "uesio" || user.Username == "boot" {
		return nil
	}

	if user.ID == "" {
		return fmt.Errorf("Error Registering Usage Event: Empty User ID ")
	}

	conn := cache.GetRedisConn()
	defer conn.Close()

	currentTime := time.Now()
	key := fmt.Sprintf("event:%s:%s:%s:%s:%s:%s", session.GetSiteTenantID(), user.ID, currentTime.Format("2006-01-02"), actiontype, metadatatype, metadataname)

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
