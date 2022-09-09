package register

import (
	"fmt"
	"time"

	"github.com/thecloudmasters/uesio/pkg/cache"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

func UsageEvent(actiontype, metadatatype, metadataname string, session *sess.Session) error {

	user := session.GetUserID()

	if user == "uesio" {
		return nil
	}

	if user == "" {
		user = "GUEST"
	}

	conn := cache.GetRedisConn()
	defer conn.Close()

	currentTime := time.Now()
	key := fmt.Sprintf("event:%s:%s:%s:%s:%s:%s", session.GetSiteTenantID(), user, currentTime.Format("2006-01-02"), actiontype, metadatatype, metadataname)

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
