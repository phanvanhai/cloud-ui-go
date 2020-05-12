//
// Copyright (c) 2018 Tencent
//
// SPDX-License-Identifier: Apache-2.0
//

package repository

import (
	"github.com/phanvanhai/cloud-ui-go/internal/domain"
	"github.com/phanvanhai/cloud-ui-go/internal/repository/mm"
)

type UserRepos interface {
	Select(id string) (domain.User, error)
	SelectByName(name string) (domain.User, error)
	SelectAll() ([]domain.User, error)
	Exists(id string) (bool, error)
	ExistsUser(user domain.User) (domain.User, error)
	Insert(user domain.User) (string, error)
	Update(user domain.User) error
	Delete(id string) error
}

func GetUserRepos() UserRepos {
	return UserRepos(&mm.UserRepository{})
}
