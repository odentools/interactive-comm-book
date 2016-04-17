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
	 * コンピュータのIPアドレスの取得
	 * @return {String} IPアドレス
	 */
	getIPAddress() {

		var nics = require('os').networkInterfaces();
		for (var nic_name in nics) {
			var nic = nics[nic_name];
			if (nic_name.match(/^wlan.*/) && nic.mac != '00:00:00:00:00:00') {
				return nic.address;
			} else if (nic_name.match(/^eth.*/) && nic.mac != '00:00:00:00:00:00') {
				return nic.address;
			}
		}

		return null;

	},


	/**
	 * コンピュータのMACアドレスの取得
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

	},


	/**
	 * クライアントのIPアドレス取得
	 * @param  {Object} req Expressのリクエスト
	 * @return {String}     IPアドレス
	 */
	getClientIPAddress(req) {

		var ip_addr = null;
		var forwardedIpsStr = req.headers['x-forwarded-for'];
		if (forwardedIpsStr) {
			var forwarded_ips = forwardedIpsStr.split(',');
			ip_addr = forwarded_ips[0];
		}
		if (!ip_addr) {
			ip_addr = req.connection.remoteAddress;
		}
		return ip_addr;

	},


	/**
	 * 自分自身の再起動
	 */
	restart: function() {

		var child_process = require('child_process');

		// Get the command and parameters of myself
		var argv = process.argv.concat(); // Copy the arguments array
		var cmd = argv.shift();

		// Start the new app
		console.log('Restarting myself...');
		var child = null;
		try {
			child = child_process.spawn(cmd, argv, {
				detached: true,
				stdio: [ 'ignore', 'ignore', 'ignore' ]
			});
			child.unref();
		} catch (e) {
			console.log('Could not restart myself - ' + e.toString());
			return;
		}

		// Quit myself
		var timer = setTimeout(function() {
			process.exit(0);
		}, 500);

	}

};
