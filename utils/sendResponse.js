const sendResponse = (res, message, result = null, statusCode = 200) => {
  return res.status(statusCode).json({ status: statusCode, message: message, result })
}

module.exports = { sendResponse }