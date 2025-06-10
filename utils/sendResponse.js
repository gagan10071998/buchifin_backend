const sendResponse = (res, message, data = null, statusCode = 200) => {
  return res.status(statusCode).json({ status: statusCode, message: message, data })
}

module.exports = { sendResponse }