/*
Arduinoにシリアル経由で送るコマンド:
* setMotorPower(Integer left_power, Integer right_power)　-　モータ出力の設定．値は−100〜100．
* setHeadLight(Integer led_power)　-　ヘッドライトの設定．値は0〜100．
* setRearLight(Integer led_power_red, led_power_green, led_power_blue)　-　バックライトの設定．値は0〜255．
* setBlinker(Boolean is_left_turn_on,  is_right_turn_on)　-　方向指示器の設定．
* setLCD(String str)　-　LCD文字列の指定．strは空文字の場合のときクリアとする．

コマンドの値について:
* Boolean は "true" または "false" という文字列として渡されます．

コマンドの例:
 setMotorPower:10:20\n\n

最初の文字列はコマンド名，2つめ以降はコマンドにより可変数の値，値の区切りはコロン(:)．
\n\nがコマンド文字列の終端記号．
*/

// 駆動用モータ方向制御
#define PIN_RIGHT_MOTER_H 2
#define PIN_RIGHT_MOTER_L 12
#define PIN_LEFT_MOTOR_H 4
#define PIN_LEFT_MOTOR_L 13

// 駆動用モータ速度制御
#define PIN_RIGHT_MOTER_VREF 3
#define PIN_LEFT_MOTOR_VREF 5

// ヘッドライト
#define PIN_HEAD_LIGHT 6

// ウィンカーライト
#define PIN_RIGHT_BLINKER 7
#define PIN_LEFT_BLINKER 8

// バックライト （フルカラー）
#define PIN_BACK_LIGHT_R 9
#define PIN_BACK_LED_G 10
#define PIN_BACK_LED_B 11

// LCDレジスタ選択
#define PIN_LCD_RS 14

// LCD読み書き設定
#define PIN_LCD_RW 15

// LCD データビット
#define PIN_LCD_D4 16
#define PIN_LCD_D5 17
#define PIN_LCD_D6 18
#define PIN_LCD_D7 19


// 初期化
void setup() {

  // 入出力設定
  pinMode(PIN_RIGHT_MOTER_H, OUTPUT);
  pinMode(PIN_RIGHT_MOTER_L, OUTPUT);
  pinMode(PIN_LEFT_MOTOR_H, OUTPUT);
  pinMode(PIN_LEFT_MOTOR_L, OUTPUT);
  pinMode(PIN_RIGHT_MOTER_VREF, OUTPUT);
  pinMode(PIN_LEFT_MOTOR_VREF, OUTPUT);
  pinMode(PIN_HEAD_LIGHT, OUTPUT);
  pinMode(PIN_RIGHT_BLINKER, OUTPUT);
  pinMode(PIN_LEFT_BLINKER, OUTPUT);
  pinMode(PIN_BACK_LIGHT_R, OUTPUT);
  pinMode(PIN_BACK_LED_G, OUTPUT);
  pinMode(PIN_BACK_LED_B, OUTPUT);
  pinMode(PIN_LCD_RS, OUTPUT);
  pinMode(PIN_LCD_RW, OUTPUT);
  pinMode(PIN_LCD_D4, OUTPUT);
  pinMode(PIN_LCD_D5, OUTPUT);
  pinMode(PIN_LCD_D6, OUTPUT);
  pinMode(PIN_LCD_D7, OUTPUT);

  // 初期値を出力
  digitalWrite(PIN_RIGHT_MOTER_H, LOW);
  digitalWrite(PIN_RIGHT_MOTER_L, LOW);
  digitalWrite(PIN_LEFT_MOTOR_H, LOW);
  digitalWrite(PIN_LEFT_MOTOR_L, LOW);
  digitalWrite(PIN_RIGHT_MOTER_VREF, LOW);
  digitalWrite(PIN_LEFT_MOTOR_VREF, LOW);
  digitalWrite(PIN_HEAD_LIGHT, LOW);
  digitalWrite(PIN_RIGHT_BLINKER, LOW);
  digitalWrite(PIN_LEFT_BLINKER, LOW);
  digitalWrite(PIN_BACK_LIGHT_R, LOW);
  digitalWrite(PIN_BACK_LED_G, LOW);
  digitalWrite(PIN_BACK_LED_B, LOW);
  digitalWrite(PIN_LCD_RS, LOW);
  digitalWrite(PIN_LCD_RW, LOW);
  digitalWrite(PIN_LCD_D4, LOW);
  digitalWrite(PIN_LCD_D5, LOW);
  digitalWrite(PIN_LCD_D6, LOW);
  digitalWrite(PIN_LCD_D7, LOW);

  // シリアルポートを9600 bps[ビット/秒] 
  Serial.begin(9600);

}


setMotorPower(int left_power, int right_power) {

  if (left_power > 0) {
    // 左モータ前進
    digitalWrite(PIN_LEFT_MOTOR_H, HIGH);
    digitalWrite(PIN_LEFT_MOTOR_L, LOW);
    analogWrite(PIN_LEFT_MOTER_VREF, left_power);
  } else if (left_power < 0) {
    // 左モータ後進
    digitalWrite(PIN_LEFT_MOTOR_H, LOW);
    digitalWrite(PIN_LEFT_MOTOR_L, HIGH);
    analogWrite(PIN_LEFT_MOTER_VREF, left_power);
  } else {
    // 左モータ停止
    digitalWrite(PIN_LEFT_MOTOR_H, LOW);
    digitalWrite(PIN_LEFT_MOTOR_L, LOW);
    analogWrite(PIN_LEFT_MOTER_VREF, left_power);
  }

  if(right_power > 0) {
    // 右モータ前進
    digitalWrite(PIN_RIGHT_MOTER_H, HIGH);
    digitalWrite(PIN_RIGHT_MOTER_L, LOW);
    analogWrite(PIN_RIGHT_MOTER_VREF, right_power);
  } else if (right_power < 0) {
    // 右モータ後進
    digitalWrite(PIN_RIGHT_MOTER_H, LOW);
    digitalWrite(PIN_RIGHT_MOTER_L, HIGH);
    analogWrite(PIN_RIGHT_MOTER_VREF, right_power);
  } else {
    // 左モータ停止
    digitalWrite(PIN_RIGHT_MOTER_H, LOW);
    digitalWrite(PIN_RIGHT_MOTER_L, HIGH); 
    analogWrite(PIN_RIGHT_MOTER_VREF, right_power);
  }

}


setHeadLight(int led_power) {

  analogWrite(PIN_HEAD_LIGHT, led_power);

}


setRearLight(int led_power_red, int led_power_green, int led_power_blue) {

  analogWrite(PIN_BACK_LIGHT_R, led_power_red);
  analogWrite(PIN_BACK_LIGHT_G, led_power_green);
  analogWrite(PIN_BACK_LIGHT_B, led_power_blue);

}


setBlinker(bool is_left_turn_on, bool is_right_turn_on) {

  digitalWrite(PIN_LEFT_BLINKER, is_left_turn_on);
  digitalWrite(PIN_RIGHT_BLINKER, is_right_turn_on);

}


setLCD(String str) {

}


void loop(){
  
  // シリアル通信受信
  String buff = "sethoge:10:20\n";  //ここをSerial.read()にする
  // 1行づつ，シリアルリードする．
  
  // コマンドの探索
  String command = buff.substring(0, buff.indexOf(":"));
  String param1, param2;
  
  // コマンドがパラメータを保有する場合
  if (buff.indexOf(":") != -1) {
    
    // パラメータが2つの場合
    if (buff.indexOf(":") != buff.lastIndexOf(":")) {
      
      // パラメータ1を探索
      param1 = buff.substring(buff.indexOf(":"), buff.lastIndexOf(":"));
  
      // パラメータ2を探索
      param2 = buff.substring(buff.lastIndexOf(":"));

    // パラメータが1つの場合
    } else {
    
      // パラメータ1を探索
      param1 = buff.substring(buff.indexOf(":"));

    }

  }

  // コマンドの実行
  switch (command) {
    case "setMotorPower":
      break;
    case "setHeadLight":
      break;
    case "setBlinker":
      break;
    case "setRearLight":
      break;
    case "setLCD":
      break;
  }
  
  // atoi(str_val1.c_str());
  
}
