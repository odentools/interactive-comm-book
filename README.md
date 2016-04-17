# interactive-comm-book

## Getting Started

	$ npm install
	$ npm test
	$ npm start

## Making of Develop Environment on Your PC

	$ git clone https://github.com/odentools/interactive-comm-book.git
	$ cd interactive-comm-book
	$ npm install

	# To start the server as development mode
	$ npm start
	
	# To start the daemon for RC Car device as development mode
	$ npm start-rccar

## Making of RC Car Device on Raspberry Pi

### 0. Make a hardware

under construction...

### 1. Install the dependency packages

	$ sudo apt-get install -y git g++ build-essentials libssl-dev \
		open-jtalk open-jtalk-mecab-naist-jdic htsengine libhtsengine-dev \
		hts-voice-nitech-jp-atr503-m001
	$ wget http://node-arm.herokuapp.com/node_latest_armhf.deb
	$ sudo dpkg -i node_latest_armhf.deb

### 2. Get the repository and install dependency modules with using npm command

	$ git clone https://github.com/odentools/interactive-comm-book.git
	$ cd interactive-comm-book
	$ npm install --production

### 3. Make a settings for automatic startup

	$ sudo vi /etc/rc.local

**/etc/rc.local** :
```
...

export CONTROL_SERVER_HOST="wss://foo.herokuapp.com"
export ARDUINO_SERIAL_PORT="/dev/ttyUSB0"

sudo -E -u pi sh -c "cd /home/pi/interactive-comm-book; npm run update-rccar; npm run start-rccar &"

exit 0
```

NOTE: You need to set the following variables in Environment Variables.

* CONTROL_SERVER_HOST
* ARDUINO_SERIAL_PORT

### 4. Allow shutdown by automatic and remote from server

	$ sudo visudo

**/etc/sudoers** :
```
pi localhost= NOPASSWD: /usr/bin/halt
```

## License

```
The MIT License (MIT).
Copyright (c) 2016 OdenTools Project.
```
