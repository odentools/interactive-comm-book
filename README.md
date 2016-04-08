# interactive-comm-book

## Getting Started

	$ npm install
	$ npm test
	$ npm start

## Making the RC Car Device with using Raspberry Pi

### 0. Make a hardware

under construction...

### 1. Install the dependency packages.

	$ sudo apt-get install -y git g++ build-essentials libssl-dev
	$ wget http://node-arm.herokuapp.com/node_latest_armhf.deb
	$ sudo dpkg -i node_latest_armhf.deb

### 2. Get the repository and install dependency modules with using npm command.

	$ git clone https://github.com/odentools/interactive-comm-book.git
	$ cd interactive-comm-book
	$ npm install --production

### 3. Make a settings for automatic startup.

	$ sudo vi /etc/rc.local

**/etc/rc.local** :
```
...

export CONTROL_SERVER_HOST="foo.herokuapp.com"
export ARDUINO_SERIAL_PORT="/dev/ttyUSB0"

sudo -E -u pi sh -c "cd /home/pi/interactive-comm-book; npm run update-rccar; npm run start-rccar &"

exit 0
```

NOTE: You need to set the following variables in Environment Variables.

* CONTROL_SERVER_HOST
* ARDUINO_SERIAL_PORT

## License

```
The MIT License (MIT).
Copyright (c) 2016 OdenTools Project.
```
