package auth

import (
	"errors"
	"fmt"

	"github.com/thecloudmasters/uesio/pkg/bundle"
	"github.com/thecloudmasters/uesio/pkg/meta"
	"github.com/thecloudmasters/uesio/pkg/sess"
	"github.com/thecloudmasters/uesio/pkg/templating"
)

func CreateLogin(namespace, name string, payload map[string]interface{}, siteAdminSession *sess.Session) (*meta.SignupMethod, error) {

	signupMethod := &meta.SignupMethod{
		Name:      name,
		Namespace: namespace,
	}

	siteAdmin := siteAdminSession.GetSiteAdmin()

	session, err := GetSystemSession(siteAdmin, nil)
	if err != nil {
		return nil, err
	}

	err = bundle.Load(signupMethod, session)
	if err != nil {
		return nil, err
	}

	authconn, err := GetAuthConnection(signupMethod.AuthSource, session)
	if err != nil {
		return nil, err
	}

	username, err := mergeTemplate(payload, signupMethod.UsernameTemplate)
	if err != nil {
		return nil, err
	}

	if !matchesRegex(username, signupMethod.UsernameRegex) {
		return nil, errors.New("Create Login failed: Regex validation failed")
	}

	domain, err := queryDomainFromSite(siteAdmin.ID)
	if err != nil {
		return nil, err
	}

	host := getHostFromDomain(domain, siteAdmin)

	link := fmt.Sprintf("%s/%s?code={####}", host, signupMethod.AdminCreate.Redirect)

	templateMergeValues := map[string]interface{}{
		"app":  siteAdmin.GetAppFullName(),
		"site": siteAdmin.Name,
		"link": link,
	}

	subjectTemplate, err := templating.NewTemplateWithValidKeysOnly(signupMethod.AdminCreate.EmailSubject)
	if err != nil {
		return nil, err
	}
	mergedSubject, err := templating.Execute(subjectTemplate, templateMergeValues)
	if err != nil {
		return nil, err
	}

	bodyTemplate, err := templating.NewTemplateWithValidKeysOnly(signupMethod.AdminCreate.EmailBody)
	if err != nil {
		return nil, err
	}
	mergedBody, err := templating.Execute(bodyTemplate, templateMergeValues)
	if err != nil {
		return nil, err
	}

	payload["subject"] = mergedSubject
	payload["message"] = mergedBody

	claims, err := authconn.CreateLogin(payload, username, session)
	if err != nil {
		return nil, err
	}

	user, err := GetUserByKey(username, session, nil)
	if err != nil {
		return nil, err
	}

	err = CreateLoginMethod(user, signupMethod, claims, session)
	if err != nil {
		return nil, err
	}

	return signupMethod, nil
}
