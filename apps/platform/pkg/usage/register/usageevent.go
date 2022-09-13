package register

import (
	"fmt"
	"time"

	"github.com/thecloudmasters/uesio/pkg/cache"
	"github.com/thecloudmasters/uesio/pkg/sess"
)

func UsageEvent(actiontype, metadatatype, metadataname string, size int64, session *sess.Session) error {

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

	conn.Send("SADD", "USAGE_KEYS", key)
	conn.Send("INCR", key)
	conn.Send("INCRBY", key+":size", size)
	conn.Flush()
	_, err := conn.Receive()
	if err != nil {
		return fmt.Errorf("Error Setting cache value: " + err.Error())
	}

	return nil
}
