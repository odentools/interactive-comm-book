/*
Arduinoにシリアル経由で送るコマンド:
* setMotorPower(Integer left_power, Integer right_power)　-　モータ出力の設定．値は−100〜100．
* setHeadLight(Integer led_power)　-　ヘッドライトの設定．値は0〜100．
* setRearLight(Boolean is_turn_on)　-　バックライトの点灯消灯の設定
* setBlinker(Boolean is_left_turn_on, Boolean is_right_turn_on)　-　方向指示器の設定

コマンドの値について:
* Boolean は "true" または "false" という文字列として渡されます．
*/

#define PIN2 2
#define PIN3 3
#define PIN4 4
#define PIN5 5
#define PIN9 9
#define PIN10 10

//初期化
void setup(){
  pinMode(PIN2, OUTPUT);
  pinMode(PIN3, OUTPUT);
  pinMode(PIN4, OUTPUT);
  pinMode(PIN5, OUTPUT);
  pinMode(PIN9, OUTPUT);
  pinMode(PIN10, OUTPUT);

  // シリアルポートを9600 bps[ビット/秒]で初期化 
  Serial.begin(9600);
}


void Move(int v1,int v2){
  
  if( v1 > 0 && v2 > 0 ){
    //前進
    for(int i = 0; i < v1; i++){
      digitalWrite(PIN2,HIGH); //このHIGHとLOWで正回転、逆回転を切り替える。
    }
    for(int i = 0; i < v1; i++){
      digitalWrite(PIN3,LOW);
    }
    for(int i = 0; i < v2; i++){
      digitalWrite(PIN4,HIGH);
    }
    for(int i = 0; i < v2; i++){
      digitalWrite(PIN5,LOW);
    }
  }

  if( v1 < 0 && v2 < 0 ){
    //後退
    for(int i = 0; i < v1; i++){
      digitalWrite(PIN2,LOW);
    }
    for(int i = 0; i < v1; i++){
      digitalWrite(PIN3,HIGH);
    }
    for(int i = 0; i < v2; i++){  
      digitalWrite(PIN4,LOW);
    }
    for(int i = 0; i < v2; i++){
      digitalWrite(PIN5,HIGH);
    }
  }
  
  if( v1 > 0 && v2 < 0){
    //右旋回
    for(int i = 0; i < v1; i++){
      digitalWrite(PIN2,HIGH);
    }
    for(int i = 0; i < v1; i++){
      digitalWrite(PIN3,LOW);
    }
    for(int i = 0; i < v2; i++){
      digitalWrite(PIN4,LOW);
    }
    for(int i = 0; i < v2; i++){
      digitalWrite(PIN5,HIGH);
    }
  }
  
  if(v1 < 0 && v2 > 0){
    //左旋回
    for(int i = 0; i < v1; i++){
      digitalWrite(PIN2,LOW);
    }
    for(int i = 0; i < v1; i++){
      digitalWrite(PIN3,HIGH);
    }
    for(int i = 0; i < v2; i++){
      digitalWrite(PIN4,HIGH);
    }
    for(int i = 0; i < v2; i++){
      digitalWrite(PIN5,LOW);
    }
  }
  
  if(v1 == 0 && v2 == 0){
    //停止
    for(int i = 0; i < v1; i++){
      digitalWrite(PIN2,LOW);
    }
    for(int i = 0; i < v1; i++){
      digitalWrite(PIN3,LOW);
    }
    for(int i = 0; i < v2; i++){
      digitalWrite(PIN4,LOW);
    }
    for(int i = 0; i < v2; i++){
      digitalWrite(PIN5,LOW);
    }
  }
}

void LED(int v,int f){
  if(f >= 0){
    digitalWrite(PIN9,HIGH);
    digitalWrite(PIN10,HIGH);
   }else{
    digitalWrite(PIN9,LOW);
    digitalWrite(PIN10,LOW);
   }
}

void loop(){
  
  //受信
  String S = "sethoge:10:20\n";  //ここをSerial.read()にする
  
  //ここでコマンド名を探索
  String command = S.substring(0,S.indexOf(":"));
  String str_val1,str_val2;

  int value1,value2,LEDvalue,flag;
  
  //入力値が有れば
  if(S.indexOf(":") != -1){
    
    //入力値が２つの場合
    if(S.indexOf(":") != S.lastIndexOf(":")){
      
      //ここで入力値1を探索
      str_val1 = S.substring(S.indexOf(":"),S.lastIndexOf(":"));
  
      //ここで入力値2を探索
      str_val2 = S.substring(S.lastIndexOf(":"));
      
    }else{//入力値が1つの場合
      //ここで入力値1を探索
      str_val1 = S.substring(S.indexOf(":"));
    }
  }

  //コマンドの判別
  if(command == "setMotorPower"){
      value1 = atoi(str_val1.c_str());
      value2 = atoi(str_val2.c_str());
    }
    
  if(command == "setHeadLight"){
      LEDvalue = atoi(str_val1.c_str());
    }

  if(command == "setRearLight"){
      if(command == "true"){
        flag == 0;
      }else{
        flag == -1;
      }
    }
    
  if(command == "setBlinker"){
    
    }

  //出力
  Move(value1,value2);
  
  LED(LEDvalue,flag);
  
}
