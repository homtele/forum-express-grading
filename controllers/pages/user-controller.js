const bcrypt = require('bcryptjs')
const { User, Restaurant, Comment, Favorite, Like, Followship } = require('../../models')
const { imgurFileHandler } = require('../../helpers/file-helpers')

const userController = {
  getUser: (req, res, next) => {
    return User
      .findByPk(req.params.id, {
        include: [
          {
            model: User,
            as: 'Followings'
          },
          {
            model: User,
            as: 'Followers'
          },
          {
            model: Comment,
            include: Restaurant
          },
          {
            model: Restaurant,
            as: 'FavoritedRestaurants'
          }
        ]
      })
      .then(user => {
        if (!user) throw new Error("User didn't exist!")
        let lastComments = {}
        user.Comments.forEach(comment => { lastComments[comment.restaurantId] = comment.toJSON() })
        lastComments = Object.values(lastComments)
        user = {
          ...user.toJSON(),
          Comments: lastComments,
          commentsCount: lastComments.length,
          favoritedRestaurantsCount: user.FavoritedRestaurants.length,
          followingsCount: user.Followings.length,
          followersCount: user.Followers.length
        }
        return res.render('users/profile', { user })
      })
      .catch(err => next(err))
  },
  editUser: (req, res, next) => {
    return User
      .findByPk(req.params.id, { raw: true })
      .then(user => {
        if (!user) throw new Error("User didn't exist!")
        return res.render('users/edit', { user })
      })
      .catch(err => next(err))
  },
  putUser: (req, res, next) => {
    if (Number(req.params.id) !== req.user.id) throw new Error("User didn't match!")
    const { name } = req.body
    const { file } = req
    return Promise.all([
      User.findByPk(req.params.id),
      imgurFileHandler(file)
    ])
      .then(([user, filePath]) => {
        if (!user) throw new Error("User did'nt exit")
        return user.update({ name, image: filePath || user.image })
      })
      .then(() => {
        req.flash('success_messages', '使用者資料編輯成功')
        res.redirect(`/users/${req.params.id}`)
      })
      .catch(err => next(err))
  },
  signUpPage: (req, res) => {
    res.render('signup')
  },
  signUp: (req, res, next) => {
    if (req.body.password !== req.body.passwordCheck) throw new Error('Passwords do not match!')
    User
      .findOne({ where: { email: req.body.email } })
      .then(user => {
        if (user) throw new Error('Email already exists!')
        return bcrypt.hash(req.body.password, 10)
      })
      .then(hash => User.create({
        name: req.body.name,
        email: req.body.email,
        password: hash
      }))
      .then(() => {
        req.flash('success_messages', '成功註冊帳號！')
        res.redirect('/signin')
      })
      .catch(err => next(err))
  },
  signInPage: (req, res) => {
    res.render('signin')
  },
  signIn: (req, res) => {
    req.flash('success_messages', '成功登入！')
    res.redirect('/restaurants')
  },
  logout: (req, res) => {
    req.flash('success_messages', '登出成功！')
    req.logout()
    res.redirect('/signin')
  },
  addFavorite: (req, res, next) => {
    return Promise.all([
      Restaurant.findByPk(req.params.restaurantId),
      Favorite.findOne({ where: { userId: req.user.id, restaurantId: req.params.restaurantId } })
    ])
      .then(([restaurant, favorite]) => {
        if (!restaurant) throw new Error("Restaurant didn't exist")
        if (favorite) throw new Error('You have favorited this restaurant!')
        return Favorite.create({ userId: req.user.id, restaurantId: req.params.restaurantId })
      })
      .then(() => res.redirect('back'))
      .catch(err => next(err))
  },
  removeFavorite: (req, res, next) => {
    return Favorite
      .findOne({ where: { userId: req.user.id, restaurantId: req.params.restaurantId } })
      .then(favorite => {
        if (!favorite) throw new Error("You haven't favorited this restaurant")
        return favorite.destroy()
      })
      .then(() => res.redirect('back'))
      .catch(err => next(err))
  },
  addLike: (req, res, next) => {
    return Promise.all([
      Restaurant.findByPk(req.params.restaurantId),
      Like.findOne({ where: { userId: req.user.id, restaurantId: req.params.restaurantId } })
    ])
      .then(([restaurant, like]) => {
        if (!restaurant) throw new Error("Restaurant didn't exist")
        if (like) throw new Error('You have liked this restaurant!')
        return Like.create({ userId: req.user.id, restaurantId: req.params.restaurantId })
      })
      .then(() => res.redirect('back'))
      .catch(err => next(err))
  },
  removeLike: (req, res, next) => {
    return Like
      .findOne({ where: { userId: req.user.id, restaurantId: req.params.restaurantId } })
      .then(like => {
        if (!like) throw new Error("You haven't liked this restaurant")
        return like.destroy()
      })
      .then(() => res.redirect('back'))
      .catch(err => next(err))
  },
  getTopUsers: (req, res, next) => {
    return User
      .findAll({ include: { model: User, as: 'Followers' } })
      .then(users => {
        const result = users
          .map(user => ({
            ...user.toJSON(),
            followerCount: user.Followers.length,
            isFollowed: req.user && req.user.Followings.some(f => f.id === user.id)
          }))
          .sort((a, b) => b.followerCount - a.followerCount)
        res.render('top-users', { users: result })
      })
      .catch(err => next(err))
  },
  addFollowing: (req, res, next) => {
    return Promise.all([
      User.findByPk(req.params.userId),
      Followship.findOne({ where: { followerId: req.user.id, followingId: req.params.userId } })
    ])
      .then(([user, followship]) => {
        if (!user) throw new Error("User didn't exist!")
        if (followship) throw new Error('You have followed this user!')
        return Followship.create({ followerId: req.user.id, followingId: req.params.userId })
      })
      .then(() => res.redirect('back'))
      .catch(err => next(err))
  },
  removeFollowing: (req, res, next) => {
    return Followship
      .findOne({ where: { followerId: req.user.id, followingId: req.params.userId } })
      .then(followship => {
        if (!followship) throw new Error("You haven't followed this restaurant")
        return followship.destroy()
      })
      .then(() => res.redirect('back'))
      .catch(err => next(err))
  }
}
module.exports = userController
