package auth

import (
	"context"
	"errors"
	"fmt"
	"log/slog"
	"strings"

	"github.com/thecloudmasters/uesio/pkg/cache"
	"github.com/thecloudmasters/uesio/pkg/meta"
)

var userCache cache.Cache[*meta.User]
var hostCache cache.Cache[*meta.Site]
var errInvalidDomainID = errors.New("invalid domain ID format")

func init() {
	userCache = cache.NewPlatformCache[*meta.User]("user", 0)
	hostCache = cache.NewPlatformCache[*meta.Site]("host", 0)
}

func GetUserCacheKey(userid string, site *meta.Site) string {
	return fmt.Sprintf("%s:%s", userid, site.GetFullName())
}

func getHostKey(domainType, domainValue string) string {
	return fmt.Sprintf("%s:%s", domainType, domainValue)
}

func DeleteUserCacheEntries(userKeys ...string) error {
	return userCache.Del(userKeys...)
}

func InvalidateUserCache() error {
	return userCache.DeleteAll()
}

func setUserCache(userUniqueKey string, site *meta.Site, user *meta.User) error {
	// Shallow clone the user, so the caller doesn't have
	// a reference to the one in the cache.
	clonedUser := *user
	return userCache.Set(GetUserCacheKey(userUniqueKey, site), &clonedUser)
}

func getUserCache(ctx context.Context, userUniqueKey string, site *meta.Site) (*meta.User, bool) {
	user, err := userCache.Get(GetUserCacheKey(userUniqueKey, site))
	if err != nil {
		if errors.Is(err, cache.ErrKeyNotFound) {
			return nil, false
		} else {
			slog.ErrorContext(ctx, fmt.Sprintf("error getting user for key [%s] from cache: %v", userUniqueKey, err))
			return nil, false
		}
	}
	// Shallow clone the user, so the caller doesn't have
	// a reference to the one in the cache.
	clonedUser := *user
	return &clonedUser, true
}

func setHostCache(domainType, domainValue string, site *meta.Site) error {
	return hostCache.Set(getHostKey(domainType, domainValue), site)
}

func getHostCache(ctx context.Context, domainType, domainValue string) (*meta.Site, bool) {
	site, err := hostCache.Get(getHostKey(domainType, domainValue))
	if err != nil {
		if errors.Is(err, cache.ErrKeyNotFound) {
			return nil, false
		} else {
			slog.ErrorContext(ctx, fmt.Sprintf("error getting site for domain type [%s] and value [%s] from cache: %v", domainType, domainValue, err))
			return nil, false
		}
	}
	return site, true
}

func ClearHostCacheForDomains(ctx context.Context, ids []string) error {
	keys := make([]string, len(ids))
	for i, id := range ids {
		key, err := getHostKeyFromDomainId(id)
		if err != nil {
			// intentionally ignoring the error here which is not ideal but due to legacy data issues, there may be malformed IDs
			// and we do not want to fail a delete operation because we can't clear the cache in that situation. In theory, if the
			// id is malformed, it should never have made it to the cache anyway since our lookup logic that results in things getting
			// in to the cache would never find the record because its malformed to begin with. In practice, we should never get an error here
			// but to avoid the inability to delete "bad" domains, we log and continue. See https://github.com/ues-io/uesio/pull/5110.
			// TODO: Consider removing this and returning an error at some point after "cleaning up" any bad data that exists in the system
			// and/or consider simply clearing the entire cache via InvalidateHostCache as a fallback. Clearing the entire cache
			// would have a negligile performance impact on the next request for every site but would ensure that when we fail to maintain
			// the cache, we ensure any potentially bad or no longer valid entries are purged. For now, choosing the less invasive approach
			// and just ignoring since the only situation that this should currently occur in is a malformed domain ID which should never
			// have made it to the cache.
			if errors.Is(err, errInvalidDomainID) {
				slog.WarnContext(ctx, fmt.Sprintf("error getting host key for domain ID '%s': %v", id, err))
				continue
			} else {
				return err
			}
		}
		keys[i] = key
	}
	return hostCache.Del(keys...)
}

func InvalidateHostCache() error {
	return hostCache.DeleteAll()
}

func getHostKeyFromDomainId(id string) (string, error) {
	// we should just be splitting here on ":" but due to legacy data issues that didn't validate input for domain IDs, any string
	// could have been input so we need to find the last occurrence of ":" to ensure we get the domain and type correctly since the
	// type was system controlled vs. direct user input.
	// TODO: As mentioned at https://github.com/ues-io/uesio/blob/b7a3e3ee67051a25fdbc9a646ac4bc371a88a1ab/apps/platform/pkg/auth/auth.go#L121, the
	// entire approach to how we handle domain IDs should be revisited and improved. Beyond what "values" we expect for a subdomain/domain for a site,
	// we have multiple approaches to parsing them depending on what operation we are performing. Deciding how custom (sub)domains are handled needs to
	// be though through, designed and approach finalized and then the code across all areas of the system (initial lookup, creating/saving, deleteing, etc.)
	// adjusted to be consistent throughout them all.
	idx := strings.LastIndex(id, ":")
	if idx == -1 {
		return "", fmt.Errorf("unable to parse domain ID: %s: %w", id, errInvalidDomainID)
	}
	domain := id[:idx]
	domainType := id[idx+1:]
	return getHostKey(domain, domainType), nil
}

func InvalidateCache() error {
	if err := InvalidateUserCache(); err != nil {
		return err
	}

	if err := InvalidateHostCache(); err != nil {
		return err
	}

	return nil
}
