const { Restaurant, Category } = require('../models')
const { getOffset, getPagination } = require('../helpers/pagination-helper')

const restaurantServices = {
  getRestaurants: (req, cb) => {
    const DEFAULT_LIMIT = 9
    const categoryId = Number(req.query.categoryId) || ''
    const page = req.query.page === '0' ? 0 : Number(req.query.page) || 1
    const limit = Number(req.query.limit) || DEFAULT_LIMIT
    Promise.all([
      Category.findAll({ raw: true }),
      Restaurant.findAndCountAll({
        where: {
          ...categoryId ? { categoryId } : {}
        },
        limit,
        offset: getOffset(limit, page),
        raw: true,
        nest: true,
        include: Category
      })
    ])
      .then(([categories, restaurants]) => {
        const pagination = getPagination(limit, page, restaurants.count)
        const FavoritedRestaurantsId = req.user?.FavoritedRestaurants ? req.user.FavoritedRestaurants.map(fr => fr.id) : []
        const LikedRestaurantsId = req.user?.LikedRestaurants ? req.user.LikedRestaurants.map(lr => lr.id) : []
        if (!pagination.pages.includes(page)) throw new Error("Page didn't exist!")
        restaurants = restaurants.rows.map(r => ({
          ...r,
          description: r.description.substring(0, 50),
          isFavorited: req.user && FavoritedRestaurantsId.includes(r.id),
          isLiked: req.user && LikedRestaurantsId.includes(r.id)
        }))
        cb(null, {
          categories,
          restaurants,
          categoryId,
          pagination
        })
      })
      .catch(err => cb(err))
  }
}
module.exports = restaurantServices
