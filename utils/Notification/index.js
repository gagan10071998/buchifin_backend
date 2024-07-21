const FCM = require('fcm-node');
const config = require("config");
const token = config.get("FCM_TOKEN");
const fcm = new FCM(token);


module.exports = {
    pushNotification: (deviceType, deviceToken, title, body, data, image = "done.svg") => {
        let message = {}
        if (deviceType == "ANDROID") {
            data['title'] = title
            data['body'] = body
            data["image"] = image
            message = { to: deviceToken, collapse_key: 'random', data: data, priority: "high" };
        }
        else { message = { to: deviceToken, collapse_key: 'random', notification: { title: title, body: body, sound: "default" }, data: data } }
        fcm.send(message, function (err, response) { if (err) { console.log("Something has gone wrong with Push Notifictaion!", err); } });
        delete data['title']
        delete data['body']
        delete data["image"]
    }
};