package auth

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"errors"
	"fmt"
	"time"

	"github.com/thecloudmasters/uesio/pkg/cache"
)

const AuthCodeLifetime = 3 * time.Minute

type authCodeRequest struct {
	CodeChallenge   string
	ChallengeMethod string
	UserID          string
	ExpiresAt       time.Time
	RedirectURI     string
}

var authCodeRequestCache = cache.NewPlatformCache[*authCodeRequest]("authCodeRequests", AuthCodeLifetime)

func AddAuthorizationCode(authCode string, req *authCodeRequest) error {
	return authCodeRequestCache.Add(authCode, req)
}

func GetAuthorizationCode(authCode string) (*authCodeRequest, error) {
	authReq, err := authCodeRequestCache.Get(authCode)
	if err != nil {
		return nil, fmt.Errorf("auth request not found: %w", err)
	}

	// platform cache is configured with an expiration but just
	// being doubly sure here
	if time.Now().After(authReq.ExpiresAt) {
		_ = DelAuthorizationCode(authCode)
		return nil, errors.New("auth request expired")
	}

	return authReq, nil
}

func DelAuthorizationCode(authCode string) error {
	return authCodeRequestCache.Del(authCode)
}

func GenerateAuthorizationCode() (string, error) {
	bytes := make([]byte, 32) // 256 bits of entropy
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}
	return base64.RawURLEncoding.EncodeToString(bytes), nil
}

func VerifyPKCEChallenge(challenge, method, verifier string) bool {
	if method != "S256" {
		return false
	}

	hash := sha256.Sum256([]byte(verifier))
	expectedChallenge := base64.RawURLEncoding.EncodeToString(hash[:])
	return challenge == expectedChallenge
}
