const Server = require('socket.io');
const utils = require('../index')
const io = new Server();

var Socket = {
    emit: function (event, data) {
        console.log("************* Socket Emit *************************")
        console.log("EventId:::::::", event, "--------->", data)
        io.sockets.emit(event, data);
    },
    emitToRoom: function (room, event, data) {
        console.log("************* Socket Emit *************************")
        console.log("RoomId::::::::", room)
        console.log("EventId:::::::", event, "--------->", data)
        io.to(room).emit(event, data);
    }
};

let Users = {

}

io.use(async (socket, next) => {
    if (socket.handshake.query && socket.handshake.query.token) {
        let decoded = await utils.jwtVerify(socket.handshake.query.token);
        if (!decoded) return next(new Error('Authentication error'));
        else {
            Users[String(socket.id)] = decoded._id
            next();
        }
    }
    else { next(new Error('Authentication error')); }
}).on("connection", function (socket) {
    console.log("************ User Attached **********")

    socket.on("connectUser", async (data) => {
        try {
            let userId = Users[String(socket.id)]
            console.log("************ User Connect **********", socket.id, userId)
            socket.join(userId);
            io.to(userId).emit("connectOk", { status: 200 });
        } catch (error) {
            console.log(error)
        }
    });

    socket.on("disConnect", async (data) => {
        try {
            let userId = Users[String(socket.id)]
            socket.leave(userId);
            delete Users[String(socket.id)]
            io.to(userId).emit("disConnect", { status: 200 });
        } catch (error) {
        }
    })

});
exports.Socket = Socket;
exports.io = io;