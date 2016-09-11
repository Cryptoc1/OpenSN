var parameters

var middleware = function(req, res, next) {
    for (endpoint in parameters) {
        /*if (pathTest.lastIndexOf('/') > pathTest.lastIndexOf('*')) {
            // There's more to the path beyond the :param
            testString = pathTest
        } else {
            testString = endpoint.replace(/(:\w*)/ig, "[a-z0-9]*\/[a-z0-9]*")
        }*/
        // console.log(pathTest)
        console.log(req.route)
    }
    next()
}

module.exports = function(params) {
    parameters = params
    return middleware
}
