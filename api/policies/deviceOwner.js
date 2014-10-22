module.exports = function (request, response, next) {

  var deviceId = request.params.id;

  if (!deviceId) {
    return response.send(400, new FlipsError('[DeviceOwner] Error requesting the device.'));
  }

  Device.findOne(deviceId)
    .populate('user')
    .exec(function (error, device) {
      if (error) {
        return response.send(500, new FlipsError('[DeviceOwner] Error retrieving the device', 'id=' + deviceId));
      }

      if (!device) {
        return response.send(404, new FlipsError('[DeviceOwner] Device not found.', 'id=' + deviceId));
      }

      var authenticatedUserId = request.user.id;
      var deviceOwnerId = device.user.id;

      if (authenticatedUserId != deviceOwnerId) {
        return response.send(403, new FlipsError('This entity does not belong to you.'));
      }

      next();
    }
  );

};
