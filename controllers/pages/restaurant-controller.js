const { User, Restaurant, Category, Comment, Favorite, Sequelize } = require('../../models')
const restaurantServices = require('../../services/restaurant-services')

const restaurantController = {
  getRestaurants: (req, res, next) => {
    restaurantServices.getRestaurants(req, (err, data) => err ? next(err) : res.render('restaurants', data))
  },
  getFeeds: (req, res, next) => {
    return Promise.all([
      Restaurant.findAll({
        limit: 10,
        order: [['createdAt', 'DESC']],
        include: [Category],
        raw: true,
        nest: true
      }),
      Comment.findAll({
        limit: 10,
        order: [['createdAt', 'DESC']],
        include: [User, Restaurant],
        raw: true,
        nest: true
      })
    ])
      .then(([restaurants, comments]) => res.render('feeds', { restaurants, comments }))
      .catch(err => next(err))
  },
  getRestaurant: (req, res, next) => {
    return Restaurant
      .findByPk(req.params.id, {
        order: [[Comment, 'createdAt', 'DESC']],
        include: [
          Category,
          { model: Comment, include: User },
          { model: User, as: 'FavoritedUsers' },
          { model: User, as: 'LikedUsers' }
        ]
      })
      .then(restaurant => {
        if (!restaurant) throw new Error("Restaurant didn't exist")
        return restaurant.increment('viewCounts')
      })
      .then(restaurant => {
        const isFavorited = restaurant.FavoritedUsers.some(f => f.id === req.user.id)
        const isLiked = restaurant.LikedUsers.some(l => l.id === req.user.id)
        res.render('restaurant', {
          restaurant: restaurant.toJSON(),
          isFavorited,
          isLiked
        })
      })
      .catch(err => next(err))
  },
  getDashboard: (req, res, next) => {
    return Promise.all([
      Restaurant
        .findByPk(req.params.id, {
          attributes: [
            'name',
            'viewCounts',
            [Sequelize.col('Category.name'), 'categoryName']
          ],
          include: [
            {
              model: Category,
              attributes: []
            }
          ]
        }),
      Comment.count({ where: { restaurantId: req.params.id } }),
      Favorite.count({ where: { restaurantId: req.params.id } })
    ])
      .then(([restaurant, commentsCount, favoritedUsersCount]) => {
        console.log(restaurant.toJSON())
        if (!restaurant) throw new Error("Restaurant didn't exist")
        return res.render('dashboard', {
          restaurant: restaurant.toJSON(),
          commentsCount,
          favoritedUsersCount
        })
      })
      .catch(err => next(err))
  },
  getTopRestaurants: (req, res, next) => {
    return Restaurant
      .findAll({
        nest: true,
        include: { model: User, as: 'FavoritedUsers' }
      })
      .then(restaurants => {
        const result = restaurants
          .map(restaurant => ({
            ...restaurant.toJSON(),
            favoritedCount: restaurant.FavoritedUsers.length,
            isFavorited: req.user && req.user.FavoritedRestaurants.some(f => f.id === restaurant.id)
          }))
          .sort((a, b) => b.favoritedCount - a.favoritedCount)
          .slice(0, 10)
        return res.render('top-restaurants', { restaurants: result })
      })
      .catch(err => next(err))
  }
}
module.exports = restaurantController
