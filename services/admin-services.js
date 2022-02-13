const { Restaurant, Category } = require('../models')
const { getOffset, getPagination } = require('../helpers/pagination-helper')

const adminServices = {
  getRestaurants: (req, cb) => {
    const DEFAULT_LIMIT = 10
    const page = req.query.page === '0' ? 0 : Number(req.query.page) || 1
    const limit = Number(req.query.limit) || DEFAULT_LIMIT
    Restaurant
      .findAndCountAll({
        raw: true,
        nest: true,
        limit,
        offset: getOffset(limit, page),
        include: Category
      })
      .then(restaurants => {
        const pagination = getPagination(limit, page, restaurants.count)
        if (!pagination.pages.includes(page)) throw new Error("Page didn't exist!")
        cb(null, {
          restaurants: restaurants.rows,
          pagination
        })
      })
      .catch(err => cb(err))
  }
}
module.exports = adminServices
