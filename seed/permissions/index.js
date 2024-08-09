module.exports = {
    /* AUTH APIs */
    '/api/v1/auth/login': {
        "ALL": {
            "POST": {
                "auth": false,
                "value": true,
                "code": 0
            }
        }
    },
    '/api/v1/auth/logout': {
        "ALL": {
            "POST": {
                "auth": true,
                "value": true,
                "code": 1
            }
        }
    },
    '/api/v1/auth/refresh_token': {
        "ALL": {
            "POST": {
                "auth": true,
                "value": true,
                "code": 2
            }
        }
    },
    '/api/v1/auth/password/change': {
        "ALL": {
            "POST": {
                "auth": true,
                "value": true,
                "code": 3
            }
        }
    },
    '/api/v1/auth/password/forgot': {
        "ALL": {
            "POST": {
                "auth": false,
                "value": true,
                "code": 4
            }
        }
    },
    '/api/v1/auth/password/reset': {
        "ALL": {
            "POST": {
                "auth": false,
                "value": true,
                "code": 5
            }
        }
    },
    '/api/v1/retailer': {
        "SUPER_ADMIN": {
            "POST": {
                "auth": true,
                "value": true,
                "code": 6
            },
            "GET": {
                "auth": true,
                "value": true,
                "code": 6
            }
        },
    },
    '/api/v1/retailer/:id': {
        "SUPER_ADMIN": {
            "GET": {
                "auth": true,
                "value": true,
                "code": 6
            },
            "PUT": {
                "auth": true,
                "value": true,
                "code": 6
            }
        }
    },
    '/api/v1/retailer/firm/:id': {
        "SUPER_ADMIN": {
            "GET": {
                "auth": true,
                "value": true,
                "code": 6
            },
        }
    },
    '/api/v1/distributor': {
        "SUPER_ADMIN": {
            "POST": {
                "auth": true,
                "value": true,
                "code": 6
            },
            "GET": {
                "auth": true,
                "value": true,
                "code": 6
            }
        },
    },
    '/api/v1/agronomist': {
        "SUPER_ADMIN": {
            "POST": {
                "auth": true,
                "value": true,
                "code": 6
            },
            "GET": {
                "auth": true,
                "value": true,
                "code": 6
            }
        },
    },
    '/api/v1/agronomist/:id': {
        "SUPER_ADMIN": {
            "GET": {
                "auth": true,
                "value": true,
                "code": 6
            },
            "PUT": {
                "auth": true,
                "value": true,
                "code": 6
            }
        }
    },
    '/api/v1/distributor/:id': {
        "SUPER_ADMIN": {
            "GET": {
                "auth": true,
                "value": true,
                "code": 6
            },
            "PUT": {
                "auth": true,
                "value": true,
                "code": 6
            }
        }
    },
    '/api/v1/distributor/firm/:id': {
        "SUPER_ADMIN": {
            "GET": {
                "auth": true,
                "value": true,
                "code": 6
            },
        }
    },
    '/api/v1/manufacturer': {
        "SUPER_ADMIN": {
            "POST": {
                "auth": true,
                "value": true,
                "code": 6
            },
            "GET": {
                "auth": true,
                "value": true,
                "code": 6
            }
        },
    },
    '/api/v1/manufacturer/:id': {
        "SUPER_ADMIN": {
            "GET": {
                "auth": true,
                "value": true,
                "code": 6
            },
            "PUT": {
                "auth": true,
                "value": true,
                "code": 6
            }
        }
    },
    '/api/v1/manufacturer/firm/:id': {
        "SUPER_ADMIN": {
            "GET": {
                "auth": true,
                "value": true,
                "code": 6
            },
        }
    },
}