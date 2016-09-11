var params = {
    "/api/v1/status/create": {
        "method": "POST",
        "required": ["access_token", "client_id", "user_id", "status"]
    },
    "/api/v1/status/:status_id": {
        "method": "GET",
        "required": ["status_id"]
    },
    "/api/v1/status/:status_id/link": {
        "method": "POST",
        "required": ["access_token", "client_id", "user_id"]
    },
    "/api/v1/status/:status_id/delete": {
        "method": "DELETE",
        "required": ["access_token", "client_id", "user_id"]
    },
    "/api/v1/status/:status_id/edit": {
        "method": "PUT",
        "required": ["access_token", "client_id", "user_id", "status"]
    },
    // User endpoints
    "/api/v1/user/create": {
        "method": "POST",
        "required": ["access_token", "client_id"]
    },
    "/api/v1/user/:user_id": {
        "method": "GET",
        "required": ["user_id"]
    },
    "/api/v1/user/:user_id/link": {
        "method": "POST",
        "required": ["access_token", "client_id", "user_id"]
    },
    "/api/v1/user/:user_id/delete": {
        "method": "DELETE",
        "required": ["access_token", "client_id", "user_id", "linker_id"]
    },
    "/api/v1/user/:user_id/edit": {
        "method": "PUT",
        "required": ["access_token", "client_id", "user_id", "user"]
    }
}
module.exports = params
