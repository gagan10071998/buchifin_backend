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
    '/api/v1/manufacturer/batch': {
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
    '/api/v1/category': {
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
    '/api/v1/category/:id': {
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
    '/api/v1/manufacturer/batch/:id': {
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
    '/api/v1/document/:id': {
        "ALL": {
            "GET": {
                "auth": true,
                "value": true,
                "code": 6
            }
        },
    },
    '/api/v1/auth/send-email-verification': {
        "ALL": {
            "POST": {
                "auth": false,
                "value": true,
                "code": 7
            }
        }
    },
    '/api/v1/auth/verify-email': {
        "ALL": {
            "POST": {
                "auth": false,
                "value": true,
                "code": 8
            }
        }
    },
    '/api/v1/auth/send-phone-verification': {
        "ALL": {
            "POST": {
                "auth": false,
                "value": true,
                "code": 9
            }
        }
    },
    '/api/v1/auth/verify-phone': {
        "ALL": {
            "POST": {
                "auth": false,
                "value": true,
                "code": 10
            }
        }
    },
    '/api/v1/product/create': {
        "ALL": {
            "POST": {
                "auth": true,
                "value": true,
                "code": 11
            },
            "GET": {
                "auth": true,
                "value": true,
                "code": 12
            }
        }
    },
    '/api/v1/product/:id': {
        "ALL": {
            "GET": {
                "auth": true,
                "value": true,
                "code": 13
            },
            "PUT": {
                "auth": true,
                "value": true,
                "code": 14
            },
            "DELETE": {
                "auth": true,
                "value": true,
                "code": 15
            }
        }
    },
    '/api/v1/product/:id/approve': {
        "SUPER_ADMIN": {
            "PUT": {
                "auth": true,
                "value": true,
                "code": 16
            }
        }
    },
    '/api/v1/product/:id/status': {
        "ALL": {
            "PUT": {
                "auth": true,
                "value": true,
                "code": 17
            }
        }
    },
    '/api/v1/product/import': {
        "SUPER_ADMIN": {
            "POST": {
                "auth": true,
                "value": true,
                "code": 18
            }
        }
    }
}