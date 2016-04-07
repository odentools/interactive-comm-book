module.exports = {


	/**
	 * 指定された変数の型判定
	 * @param  {String}  type 期待される型名
	 * @param  {[type]}  obj  判定する変数
	 * @return {Boolean}      当該変数が当該の型であるかどうか
	 */
	isType: function (type, obj) {
		var clas = Object.prototype.toString.call(obj).slice(8, -1);
		return obj !== undefined && obj !== null && clas === type;
	},


	/**
	 * MACアドレスの取得
	 * @return {String} MACアドレス
	 */
	getMACAddress() {

		var nics = require('os').networkInterfaces();
		for (var nic_name in nics) {
			var nic = nics[nic_name];
			if (nic_name.match(/^wlan.*/) && nic.mac != '00:00:00:00:00:00') {
				return nic.mac;
			} else if (nic_name.match(/^eth.*/) && nic.mac != '00:00:00:00:00:00') {
				return nic.mac;
			}
		}

		return null;

	}

};
