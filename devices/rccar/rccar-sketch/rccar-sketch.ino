/*
  Arduinoにシリアル経由で送るコマンド:
  setMotorPower(Integer left_power, Integer right_power)　-　モータ出力の設定．値は−100〜100．
  setHeadLight(Integer led_power)　-　ヘッドライトの設定．値は0〜100．
  setRearLight(Integer led_power_red, led_power_green, led_power_blue)　-　バックライトの設定．値は0〜255．
  setBlinker(Boolean is_left_turn_on,  is_right_turn_on)　-　方向指示器の設定．
  setLCD(String str)　-　LCD文字列の指定．strは空文字の場合のときクリアとする．

  コマンドの値について:
  Boolean は "true" または "false" という文字列として渡されます．

  コマンドの例:
  setMotorPower:10:20\n\n

  最初の文字列はコマンド名，2つめ以降はコマンドにより可変数の値，値の区切りはコロン(:)．
  \n\nがコマンド文字列の終端記号．
*/
#include <LiquidCrystal.h>

// 駆動用モータ回転方向制御
const int PIN_RIGHT_MOTOR_H = 2;
const int PIN_RIGHT_MOTOR_L = 12;
const int PIN_LEFT_MOTOR_H = 4;
const int PIN_LEFT_MOTOR_L = 13;

// 駆動用モータ速度制御
const int PIN_RIGHT_MOTOR_VREF = 3;
const int PIN_LEFT_MOTOR_VREF = 5;

// ヘッドライト
const int PIN_HEAD_LIGHT = 6;

// ウィンカーライト
const int PIN_RIGHT_BLINKER = 7;
const int PIN_LEFT_BLINKER = 8;

// バックライト （フルカラー）
const int PIN_BACK_LIGHT_R = 9;
const int PIN_BACK_LIGHT_G = 10;
const int PIN_BACK_LIGHT_B = 11;

// LCDレジスタ選択
const int PIN_LCD_RS = 14;

// LCD読み書き設定
const int PIN_LCD_RW = 15;

// LCD データビット
const int PIN_LCD_D4 = 16;
const int PIN_LCD_D5 = 17;
const int PIN_LCD_D6 = 18;
const int PIN_LCD_D7 = 19;

// コマンドパラメータの最大数
const int MAX_COMMAND_PARAMETER = 3; 

LiquidCrystal lcd(14, 15, 16, 17, 18, 19);

// 初期化
void setup() {

  // 入出力設定
  pinMode(PIN_RIGHT_MOTOR_H, OUTPUT);
  pinMode(PIN_RIGHT_MOTOR_L, OUTPUT);
  pinMode(PIN_LEFT_MOTOR_H, OUTPUT);
  pinMode(PIN_LEFT_MOTOR_L, OUTPUT);
  pinMode(PIN_RIGHT_MOTOR_VREF, OUTPUT);
  pinMode(PIN_LEFT_MOTOR_VREF, OUTPUT);
  pinMode(PIN_HEAD_LIGHT, OUTPUT);
  pinMode(PIN_RIGHT_BLINKER, OUTPUT);
  pinMode(PIN_LEFT_BLINKER, OUTPUT);
  pinMode(PIN_BACK_LIGHT_R, OUTPUT);
  pinMode(PIN_BACK_LIGHT_G, OUTPUT);
  pinMode(PIN_BACK_LIGHT_B, OUTPUT);
  pinMode(PIN_LCD_RS, OUTPUT);
  pinMode(PIN_LCD_RW, OUTPUT);
  pinMode(PIN_LCD_D4, OUTPUT);
  pinMode(PIN_LCD_D5, OUTPUT);
  pinMode(PIN_LCD_D6, OUTPUT);
  pinMode(PIN_LCD_D7, OUTPUT);

  // 初期値を出力
  digitalWrite(PIN_RIGHT_MOTOR_H, LOW);
  digitalWrite(PIN_RIGHT_MOTOR_L, LOW);
  digitalWrite(PIN_LEFT_MOTOR_H, LOW);
  digitalWrite(PIN_LEFT_MOTOR_L, LOW);
  digitalWrite(PIN_RIGHT_MOTOR_VREF, LOW);
  digitalWrite(PIN_LEFT_MOTOR_VREF, LOW);
  digitalWrite(PIN_HEAD_LIGHT, LOW);
  digitalWrite(PIN_RIGHT_BLINKER, LOW);
  digitalWrite(PIN_LEFT_BLINKER, LOW);
  digitalWrite(PIN_BACK_LIGHT_R, LOW);
  digitalWrite(PIN_BACK_LIGHT_G, LOW);
  digitalWrite(PIN_BACK_LIGHT_B, LOW);
  digitalWrite(PIN_LCD_RS, LOW);
  digitalWrite(PIN_LCD_RW, LOW);
  digitalWrite(PIN_LCD_D4, LOW);
  digitalWrite(PIN_LCD_D5, LOW);
  digitalWrite(PIN_LCD_D6, LOW);
  digitalWrite(PIN_LCD_D7, LOW);

  // シリアルポートを9600 bps[ビット/秒]
  Serial.begin(9600);

  // LCD初期化
  lcd.begin(16, 2);
  delay(1000);

  // 起動メッセージの表示
  setLCD("Running Now");
  delay(500);

  for (int i = 11; i < 14; i++) {
    lcd.setCursor(i, 0);
    lcd.print(".");
    delay(500);
  }

  setLCD("Created by\n\n      Oden Tools");

}


void setMotorPower(int left_power, int right_power) {

  if (left_power > 0) {
    // 左モータ前進
    digitalWrite(PIN_LEFT_MOTOR_H, HIGH);
    digitalWrite(PIN_LEFT_MOTOR_L, LOW);
    analogWrite(PIN_LEFT_MOTOR_VREF, left_power);
  } else if (left_power < 0) {
    // 左モータ後進
    digitalWrite(PIN_LEFT_MOTOR_H, LOW);
    digitalWrite(PIN_LEFT_MOTOR_L, HIGH);
    analogWrite(PIN_LEFT_MOTOR_VREF, left_power);
  } else {
    // 左モータ停止
    digitalWrite(PIN_LEFT_MOTOR_H, LOW);
    digitalWrite(PIN_LEFT_MOTOR_L, LOW);
    analogWrite(PIN_LEFT_MOTOR_VREF, left_power);
  }

  if (right_power > 0) {
    // 右モータ前進
    digitalWrite(PIN_RIGHT_MOTOR_H, HIGH);
    digitalWrite(PIN_RIGHT_MOTOR_L, LOW);
    analogWrite(PIN_RIGHT_MOTOR_VREF, right_power);
  } else if (right_power < 0) {
    // 右モータ後進
    digitalWrite(PIN_RIGHT_MOTOR_H, LOW);
    digitalWrite(PIN_RIGHT_MOTOR_L, HIGH);
    analogWrite(PIN_RIGHT_MOTOR_VREF, right_power);
  } else {
    // 左モータ停止
    digitalWrite(PIN_RIGHT_MOTOR_H, LOW);
    digitalWrite(PIN_RIGHT_MOTOR_L, HIGH);
    analogWrite(PIN_RIGHT_MOTOR_VREF, right_power);
  }

}


void setHeadLight(int led_power) {

  analogWrite(PIN_HEAD_LIGHT, led_power);

}


void setRearLight(int led_power_red, int led_power_green, int led_power_blue) {

  analogWrite(PIN_BACK_LIGHT_R, led_power_red);
  analogWrite(PIN_BACK_LIGHT_G, led_power_green);
  analogWrite(PIN_BACK_LIGHT_B, led_power_blue);

}


void setBlinker(bool is_left_turn_on, bool is_right_turn_on) {

  digitalWrite(PIN_LEFT_BLINKER, is_left_turn_on);
  digitalWrite(PIN_RIGHT_BLINKER, is_right_turn_on);

}


void setLCD(String str) {

  lcd.clear();
  lcd.print(str.substring(0, str.indexOf("\\n")));

  if(str.indexOf("\\n") != -1) {
    lcd.setCursor(0, 1);
    lcd.print(str.substring(str.indexOf("\\n")+2, str.length()));
  }

}


bool atob(String str) {

  if (str == "true") return true;
  else return false;  
}


void loop() {

  String buff;
    
  // シリアル受信時
  while (Serial.available() > 0) {

    // バッファに読み込む
    char c = Serial.read();

    if ( c == ';') break;
    buff += c;

  }

  delay(100);
  Serial.print(buff);

  // コマンドの探索
  int index = buff.indexOf(":"), nextIndex;
  String command = buff.substring(0, index);
  String param[MAX_COMMAND_PARAMETER];

  // コマンドがパラメータを保有する場合
  if (index != -1) {

    // パラメータ1を探索
    for (int i = 0; i < MAX_COMMAND_PARAMETER; i++) {

      nextIndex = buff.indexOf(":", index+1);
      param[i] = buff.substring(index+1, nextIndex);
      index = nextIndex;
  
      if (index == -1) break;

    }

  }

  // コマンドの実行
  if (command == "setMotorPower") {
    setMotorPower(atoi(param[0].c_str()), atoi(param[1].c_str()));
  } else if (command == "setHeadLight") {
    setHeadLight(atoi(param[0].c_str()));
  } else if (command == "setBlinker") {
    setBlinker(atob(param[0]), atob(param[1]));Serial.print(param[1]);
  } else if (command == "setRearLight") {
    setRearLight(atoi(param[0].c_str()), atoi(param[1].c_str()), atoi(param[2].c_str()));
  } else if (command == "setLCD") {
    setLCD(param[0]);
  }

}
