/**
 * DeviceController
 *
 * @description :: Server-side logic for managing Devices
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */

module.exports = {

  findOne: function (request, response) {
    var deviceId = request.params.id;

    if (!deviceId) {
      return response.send(400, new MugError('Invalid parameter [id]'));
    }

    Device.findOne(deviceId)
      .exec(function (error, device) {
        if (error) {
          return response.send(500, new MugError('Error retrieving the device.', error.details));
        }

        if (!device) {
          return response.send(404, new MugError('Device not found', 'Id='+deviceId));
        }

        return response.send(200, device);
      }
    );
  }
	
};

