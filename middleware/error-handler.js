const apiErrorHandler = (err, req, res, next) => {
  if (err instanceof Error) {
    res.status(500).json({
      status: 'errer',
      message: `${err.name}: ${err.message}`
    })
  } else {
    res.status(500).json({
      status: 'errer',
      message: `${err}`
    })
  }
}
const generalErrorHandler = (err, req, res, next) => {
  if (err instanceof Error) {
    req.flash('error_messages', `${err.name}: ${err.message}`)
  } else {
    req.flash('error_messages', `${err}`)
  }
  res.redirect('back')
  next(err)
}
module.exports = {
  apiErrorHandler,
  generalErrorHandler
}
