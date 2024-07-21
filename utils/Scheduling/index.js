const app = require("express")(),
 Agenda = require("agenda"),
 models = require("../../models"),
 config = require("config"),
 moment = require("moment"),
 {Socket} = require("../Sockets"),
 fcm = require("../Notification"),
 agenda = new Agenda({ db: { address: config.get("DB_URL") } });

const agendas = {
  willNotify: async(customer, admin, bookingData) => {  
    try {
      await agenda.start();
      agenda.define("Reminder", async(job, done) => {
        fcm.pushNotification(
          customer.deviceType,
          customer.deviceToken,
          "Booking Reminder !",
          `Your booking with id ${bookingData._id} is sheduled for tommorow !`
        );
        Socket.emit("newBooking", bookingData)
        await job.save();
        return done();
      });
      const dateIdx = new Date(bookingData.date).getDay();
      const days = ["","monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
      const day = days[dateIdx];
      const slot = await models.Slots.findOne({day: day});
      let time = moment(slot.st).format("LT");
      let notifyTime = moment(time).startOf('hour').fromNow();
      await agenda.schedule(notifyTime ,"Reminder",
       { customer, admin, bookingData }
      );
    } catch (error) {
      throw error
    }
  }
};


module.exports = agendas;
