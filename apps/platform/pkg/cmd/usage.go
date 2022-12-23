package cmd

import (
	"errors"
	"fmt"
	"strconv"
	"strings"
	"time"

	"github.com/gomodule/redigo/redis"
	"github.com/spf13/cobra"
	"github.com/thecloudmasters/uesio/pkg/adapt"
	"github.com/thecloudmasters/uesio/pkg/auth"
	"github.com/thecloudmasters/uesio/pkg/cache"
	"github.com/thecloudmasters/uesio/pkg/datasource"
	"github.com/thecloudmasters/uesio/pkg/logger"
	"github.com/thecloudmasters/uesio/pkg/meta"
)

func init() {
	rootCmd.AddCommand(&cobra.Command{
		Use:   "usage",
		Short: "uesio usage",
		Run:   usage,
	})
}

func usage(cmd *cobra.Command, args []string) {

	logger.Log("Running uesio worker", logger.INFO)

	for {
		err := UsageJob()
		if err != nil {
			logger.Log("Usage Job failed reason: "+err.Error(), logger.ERROR)
		}
		time.Sleep(1 * time.Second)
	}

}

func UsageJob() error {

	logger.Log("Usage Job Running", logger.INFO)

	conn := cache.GetRedisConn()
	defer conn.Close()

	keys, err := redis.Strings(conn.Do("SMEMBERS", "USAGE_KEYS"))
	if err != nil {
		return fmt.Errorf("Error Getting Usage Event: " + err.Error())
	}

	if len(keys) == 0 {
		logger.Log("Job completed, nothing to process", logger.INFO)
		return nil
	}

	keyArgs := redis.Args{}.AddFlat(keys)

	values, err := redis.Strings(conn.Do("MGET", keyArgs...))
	if err != nil {
		return fmt.Errorf("Error Getting Usage Event: " + err.Error())
	}

	_, err = conn.Do("DEL", keyArgs...)
	if err != nil {
		return fmt.Errorf("Error Getting Usage Event: " + err.Error())
	}

	_, err = conn.Do("DEL", "USAGE_KEYS")
	if err != nil {
		return fmt.Errorf("Error Getting Usage Event: " + err.Error())
	}

	changes := meta.UsageCollection{}
	for i, key := range keys {
		keyParts := strings.Split(key, ":")
		if len(keyParts) != 9 {
			return fmt.Errorf("Error Getting Usage Event: " + err.Error())
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

		session, err := auth.GetStudioSystemSession(nil)
		if err != nil {
			return err
		}

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
			return errors.New("Failed to update usage events: " + err.Error())
		}
	}

	logger.Log("Job completed, no issues found", logger.INFO)
	return nil
}
