package usage_worker

import (
	"errors"
	"fmt"
	"log/slog"
	"strconv"
	"strings"

	"github.com/gomodule/redigo/redis"

	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/auth"
	"github.com/thecloudmasters/uesio/pkg/cache"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/usage/usage_common"
)

const MAX_USAGE_PER_RUN = 1000

func UsageWorker() error {

	slog.Info("Running usage worker job")

	conn := cache.GetRedisConn()
	defer func(conn redis.Conn) {
		err := conn.Close()
		if err != nil {
			slog.Error(err.Error())
		}
	}(conn)

	session, err := auth.GetStudioSystemSession(nil)
	if err != nil {
		return errors.New("Unable to obtain a system session to use for usage events job: " + err.Error())
	}

	// SPOP gets and removes up to N random members from a set.
	// If these keys are NOT successfully processed, we will need to add them back to the set
	// in order to ensure that a subsequent job processes them.
	keys, err := redis.Strings(conn.Do("SPOP", usage_common.RedisKeysSetName, MAX_USAGE_PER_RUN))
	if err != nil {
		return fmt.Errorf("Error getting usage set members: " + err.Error())
	}

	if len(keys) == 0 {
		slog.Info("Job completed, no usage events to process")
		return nil
	}

	keyArgs := redis.Args{}.AddFlat(keys)

	values, err := redis.Strings(conn.Do("MGET", keyArgs...))
	if err != nil {
		return fmt.Errorf("Error fetching usage keys: " + err.Error())
	}

	changes := meta.UsageCollection{}
	for i, key := range keys {
		// Make sure the value was actually there
		if key == "nil" {
			continue
		}
		keyParts := strings.Split(key, ":")
		if len(keyParts) != 9 {
			slog.Error("Usage key did not match expected pattern: " + key)
			continue
		}

		tenantType := keyParts[1]
		if tenantType != "site" {
			continue
		}

		//tenantID eq Site UniqueKey
		tenantID := fmt.Sprintf("%s:%s", keyParts[2], keyParts[3])

		usageItem := &meta.Usage{
			User:         keyParts[4],
			Day:          keyParts[5],
			ActionType:   keyParts[6],
			MetadataType: keyParts[7],
			MetadataName: keyParts[8],
			App: &meta.App{
				BuiltIn: meta.BuiltIn{
					UniqueKey: keyParts[2],
				},
			},
			Site: &meta.Site{
				BuiltIn: meta.BuiltIn{
					UniqueKey: tenantID,
				},
			},
		}

		total, _ := strconv.ParseInt(values[i], 10, 64)
		usageItem.SetField("uesio/studio.total", total)
		changes = append(changes, usageItem)

	}

	if len(changes) > 0 {

		requests := []datasource.SaveRequest{
			{
				Collection: "uesio/studio.usage",
				Wire:       "CoolWireName",
				Changes:    &changes,
				Options:    &adapt.SaveOptions{Upsert: true},
			},
		}

		err = datasource.SaveWithOptions(requests, session, nil)
		if err != nil {
			// Restore the usage keys which we failed to process back to the set
			_, err = conn.Do("SADD", redis.Args{}.Add(usage_common.RedisKeysSetName).AddFlat(keys))
			return errors.New("Failed to update usage events: " + err.Error())
		} else {
			slog.Info("Successfully processed %d usage events", len(changes))
		}
	}

	// Now that we've successfully saved, delete the keys
	_, err = conn.Do("DEL", keyArgs...)
	if err != nil {
		return fmt.Errorf("Error deleting usage keys: " + err.Error())
	}

	slog.Info("Usage job completed, no issues found")
	return nil
}
