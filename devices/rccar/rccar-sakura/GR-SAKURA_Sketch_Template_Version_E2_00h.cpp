/*GR-SAKURA Sketch Template Version: E2.00h*/

#include <Arduino.h>

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
  setMotorPower:10:20;

  最初の文字列はコマンド名，2つめ以降はコマンドにより可変数の値，値の区切りはコロン(:)．
  ;がコマンド文字列の終端記号．
*/
#include <LiquidCrystal.h>
#include <MsTimer2.h>

// 駆動用モータ回転方向制御
const int PIN_RIGHT_MOTOR_H = 46;
const int PIN_RIGHT_MOTOR_L = 44;
const int PIN_LEFT_MOTOR_H = 47;
const int PIN_LEFT_MOTOR_L = 45;

// 駆動用モータ速度制御
const int PIN_RIGHT_MOTOR_VREF = 48;
const int PIN_LEFT_MOTOR_VREF = 49;

// ヘッドライト
const int PIN_HEAD_LIGHT = 42;

// ウィンカーライト
const int PIN_RIGHT_BLINKER = 43;
const int PIN_LEFT_BLINKER = 44;

// バックライト （フルカラー）
const int PIN_BACK_LIGHT_R = 45;
const int PIN_BACK_LIGHT_G = 46;
const int PIN_BACK_LIGHT_B = 47;

// LCDレジスタ選択
const int PIN_LCD_RS = 14;

// LCD イネーブル信号
const int PIN_LCD_E = 15;

// LCD データビット
const int PIN_LCD_D4 = 16;
const int PIN_LCD_D5 = 17;
const int PIN_LCD_D6 = 18;
const int PIN_LCD_D7 = 19;

// コマンドパラメータの最大数
const int MAX_COMMAND_PARAMETER = 3; 

// LiquidCrystal(rs, enable, d4, d5, d6, d7) 
LiquidCrystal lcd(PIN_LCD_RS, PIN_LCD_E, PIN_LCD_D4, PIN_LCD_D5, PIN_LCD_D6, PIN_LCD_D7);

boolean LEFT_BLINKER = LOW;
boolean RIGHT_BLINKER = LOW;


// 割り込み用
void flash() {

  if (LEFT_BLINKER) {
    digitalWrite(PIN_LEFT_BLINKER, !digitalRead(PIN_LEFT_BLINKER));
  } else {
    digitalWrite(PIN_LEFT_BLINKER, LOW);
  }

  if (RIGHT_BLINKER) {
    digitalWrite(PIN_RIGHT_BLINKER, !digitalRead(PIN_RIGHT_BLINKER));
  } else {
    digitalWrite(PIN_RIGHT_BLINKER, LOW);    
  }
  
}


void setMotorPower(int left_power, int right_power) {

  if (left_power > 0) {
    // 左モータ前進
    digitalWrite(PIN_LEFT_MOTOR_H, HIGH); // 1
    digitalWrite(PIN_LEFT_MOTOR_L, LOW);  // 0
  } else if (left_power < 0) {
    // 左モータ後進
    digitalWrite(PIN_LEFT_MOTOR_H, LOW);  // 0
    digitalWrite(PIN_LEFT_MOTOR_L, HIGH); // 1
  } else {
    // 左モータ停止
    digitalWrite(PIN_LEFT_MOTOR_H, LOW);  // 0
    digitalWrite(PIN_LEFT_MOTOR_L, LOW);  // 0
  }

  if (right_power > 0) {
    // 右モータ前進
    digitalWrite(PIN_RIGHT_MOTOR_H, HIGH);  // 1
    digitalWrite(PIN_RIGHT_MOTOR_L, LOW);   // 0
  } else if (right_power < 0) {
    // 右モータ後進
    digitalWrite(PIN_RIGHT_MOTOR_H, LOW);   // 0
    digitalWrite(PIN_RIGHT_MOTOR_L, HIGH);  // 1
  } else {
    // 左モータ停止
    digitalWrite(PIN_RIGHT_MOTOR_H, LOW);   // 0
    digitalWrite(PIN_RIGHT_MOTOR_L, LOW);   // 0
  }
  
  analogWrite(PIN_LEFT_MOTOR_VREF, left_power);
  analogWrite(PIN_RIGHT_MOTOR_VREF, right_power);

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

  LEFT_BLINKER = is_left_turn_on;
  RIGHT_BLINKER =is_right_turn_on;
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
  pinMode(PIN_LCD_E, OUTPUT);
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
  digitalWrite(PIN_LCD_E, LOW);
  digitalWrite(PIN_LCD_D4, LOW);
  digitalWrite(PIN_LCD_D5, LOW);
  digitalWrite(PIN_LCD_D6, LOW);
  digitalWrite(PIN_LCD_D7, LOW);

  // シリアルポートを9600 bps[ビット/秒]
  Serial.begin(9600);

  MsTimer2::set(500, flash);
  MsTimer2::start();

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

  setLCD("Created by\\n      Oden Tools");

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

  if (buff.length() > 0)
    Serial.println(buff);

  // コマンドの探索
  int index = buff.indexOf(":"), nextIndex;
  String command = buff.substring(0, index);
  String param[MAX_COMMAND_PARAMETER];

  // コマンドがパラメータを保有する場合
  if (index != -1) {

    // パラメータ1を探索
    for (int i = 0; i < MAX_COMMAND_PARAMETER; i++) {

      nextIndex = buff.indexOf(":", index+1);
      if ( nextIndex != -1) {
        param[i] = buff.substring(index+1, nextIndex);Serial.println(param[i]);
        index = nextIndex;
      } else { 
        param[i] = buff.substring(index+1, buff.length());Serial.println(param[i]);
        break;
      }

    }

  }

  // コマンドの実行
  if (command == "setMotorPower") {
    setMotorPower(atoi(param[0].c_str()), atoi(param[1].c_str()));
  } else if (command == "setHeadLight") {
    setHeadLight(atoi(param[0].c_str()));
  } else if (command == "setBlinker") {
    setBlinker(atob(param[0]), atob(param[1]));
  } else if (command == "setRearLight") {
    setRearLight(atoi(param[0].c_str()), atoi(param[1].c_str()), atoi(param[2].c_str()));
  } else if (command == "setLCD") {
    setLCD(param[0]);
  } else if (command == "test") {
	pinMode(atoi(param[0].c_str()), OUTPUT);
  	analogWrite(atoi(param[0].c_str()), atoi(param[1].c_str()));
  }

}