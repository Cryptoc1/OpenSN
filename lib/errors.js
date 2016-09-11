module.exports = function(code, options) {
    err = {
        code: code,
        success: false,
        message: (options && options.message) ? options.message : ""
    }
    switch (code) {
        case 400:
            err.label = "Invalid Request"
            break
        case 401:
            err.label = "Unauthorized"
            break
        case 403:
            err.label = "No, No, No. (Forbidden)"
            break
        case 404:
            err.label = "Resource Not Found"
            break
        case 500:
            err.label = "Internal Server Error"
            break
        case 522:
            err.label = "Database Service Error"
            break
        default:
            err.code = 500
            err.label = "Internal Server Error"
    }
    return err
}
