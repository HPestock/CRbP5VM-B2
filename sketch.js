const w = 400;
const h = 300;

var escape = 0;
var running = 1;

var memory;
var vMEM;

const R_R0 = 0x0;
const R_R1 = 0x1;
const R_R2 = 0x2;
const R_R3 = 0x3;
const R_R4 = 0x4;
const R_R5 = 0x5;
const R_R6 = 0x6;
const R_R7 = 0x7;
const R_R8 = 0x8;
const R_R9 = 0x9;
const R_R10 = 0xA;
const R_R11 = 0xB;
const R_R12 = 0xC;
const R_R13 = 0xD;
const R_R14 = 0xE;
const R_R15 = 0xF;
const R_PC = 0x10;
const R_PCRET = 0x11;
const R_INTRET = 0x12;
const R_IRQRET = 0x13;
const R_SSK = 0x14;
const R_SYSRET = 0x15;

var FL = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]; //EQ LT GT UN UN UN UN UN UN UN UN UN UN UN UN UN

var r = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];

var coms = [0,0];
var IRQ = 0;
var DOIRQ = 0;

//IRQ CODES:
//0 - Key Pressed, ref coms [0, 1]

//MEMORY TYPE TYPES LD_1 LD_2 ST_1 ST_2
const T_NUM = 0x0; //nyny
const T_REG = 0x1; //yyny
const T_LOC = 0x2; //yyyy
const T_PLOC = 0x3; //yyyy

//BRANCH TYPE TYPES
const T_EQ = 0x0;
const T_NE = 0x1;
const T_LT = 0x2;
const T_LE = 0x3;
const T_GT = 0x4;
const T_GE = 0x5;
const T_NC = 0x6;

//JUMP TYPES
const T_G = 0x0; //Global (PC = memory[x])
const T_LS = 0x1; //Local Subtract (PC -= memory[x])
const T_LA = 0x2; //Local Add (PC += memory[x])

 const I_NOP = 0x0;
 const I_LD = 0x1; //LD TYPE_1 TYPE_2 IN_RECEIVER IN_INPUT
const I_ST = 0x2; //ST TYPE_1 TYPE_2 IN_LOCATION IN_INPUT (Use LD instead, is more versatile)
 const I_BR = 0x3; //BR IF_TYPE JMP_TYPE SETPCRET GOTOTYPE GOTO
const I_JMP = 0x4; //JMP JMP_TYPE GOTO (Use BR with type T_NC instead)
const I_JSR = 0x5; //JSR JMP_TYPE GOTO (Use BR with type T_NC instead)
 const I_RETS = 0x6; //RETS
 const I_ADD = 0x7; //ADD TYPE_1 TYPE_2 IN_RECEIVER IN_INPUT
 const I_SUB = 0x8; //SUB TYPE_1 TYPE_2 IN_RECEIVER IN_INPUT
 const I_SYSCALL = 0x9; //SYSCALL
const I_IRQ = 0xA; //IRQ TYPE
const I_INT = 0xB; //INT TYPE
 const I_SSK = 0xC; //SET START OF KERNEL : SSK (MEMORY_LOCATION)
 const I_SETV = 0xD; //SETV START END SET SKIP
 const I_RLV = 0xE; //RLV
 const I_ESC = 0xF; //ESC
 const I_CMP = 0x10; //CMP TYPE_1 TYPE_2 IN_RECEIVER IN_INPUT
 const I_RLP = 0x11; //RLP PIXEL_START PIXEL_END
 const I_RCD = 0x12; //RCD COM_DEVICE_ITER MEMLOADLOC
 const I_CIRQ = 0x13; //CIRQ MEMLOADLOC
 const I_LIRQ = 0x14; //LIRQ MEMLOADLOC
 const I_BIT = 0x15; //BIT I_BIT_TYPE BIT MEMLOCIN MEMLOCOUT
 const I_SETVT = 0x16; //SETV TYPESTART TYPEEND TYPESET TYPESKIP START END SET SKIP
 const I_HALT = 0xFFFF; //HALT

function getdigit(x,d){
	var td = 10**d;
	return Math.floor(x/(td))-(10*Math.floor((0.1*x)/(td)));
}

function convertToBinary(x) {
    let bin = 0;
    let rem, i = 1, step = 1;
    while (x != 0) {
        rem = x % 2;
        /*console.log(
            `Step ${step++}: ${x}/2, Remainder = ${rem}, Quotient = ${parseInt(x/2)}`
        );*/
        x = parseInt(x / 2);
        bin = bin + rem * i;
        i = i * 10;
    }
    return bin;
}

function manipulateBinaryNumber(decimalnum, bindigit, newbindigit){
	var k = "0000000000000000";
	var binNum = convertToBinary(decimalnum).toString();
	for(var i=0;i<binNum.length;i++){
		if(i==bindigit){
			k+=newbindigit.toString();
		}else{
			k+=binNum.charAt(i);
		}
	}
	return parseInt(k, 2);
}

//program[0] is .orig
var program = [
				0x258, 
				I_SETV, 0, 2, 255, 1, 
				I_RLV, 
				I_ESC, 
				I_SETV, 1, 2, 0, 1, 
				I_RLV, 
				I_ESC, 
				I_BR, T_NC, T_G, 0, T_NUM, 0x258, 
				I_HALT
			];
			
var program_ns = [
				0x600, 
				I_BR, T_NC, T_G, 0, T_REG, R_SYSRET
			];

function load_program(ld_prog){
	r[R_PC]=ld_prog[0];
	for(var i=1;i<ld_prog.length;i++){
		memory[ld_prog[0] + (i-1)] = ld_prog[i];
	}
}

function load_program_ns(ld_prog){
	//r[R_PC]=ld_prog[0];
	for(var i=1;i<ld_prog.length;i++){
		memory[ld_prog[0] + (i-1)] = ld_prog[i];
	}
}

function set_memory(){
	memory = [];
	for(var i=0;i<0xFFFF;i++){
		memory.push(0);
	}
}

function reload_video(){
	for(var i=0;i<vMEM.length;i+=3){
		var c = color(vMEM[i], vMEM[i+1], vMEM[i+2]);
		set((i/3)-(Math.floor((i/3)/w)*w), Math.floor((i/4)/h), c);
	}
	updatePixels();
}

function reload_pixel(locstart, locend){
	for(var i=locstart;i<=locend;i+=3){
		var c = color(vMEM[i], vMEM[i+1], vMEM[i+2]);
		set((i/3)-(Math.floor((i/3)/w)*w), Math.floor((i/4)/h), c);
	}
	updatePixels();
}

function get_val(type, data){
	if(type == T_NUM){
		return data;
	}else if(type == T_REG){
		return r[data];
	}else if(type == T_LOC){
		return memory[data];
	}else if(type == T_PLOC){
		return memory[memory[data]];
	}else{
		//ERR
		console.log("ERR: Unknown Data Type");
	}
}

function set_val(type, loc, data){
	if(type == T_NUM){
		//ERR
		console.log("ERR: Cannot Set Value Of Number");
	}else if(type == T_REG){
		r[loc]=data;
	}else if(type == T_LOC){
		memory[loc]=data;
	}else if(type == T_PLOC){
		memory[memory[loc]]=data;
	}else{
		//ERR
		console.log("ERR: Unknown Data Type");
	}
}
			
function setup() {
  createCanvas(w, h);
  frameRate(165);
  prestartprompt();
  set_memory();
  load_program(program);
  load_program_ns(program_ns);
  vMEM = [];
  for(var i=0; i<(w*h*3); i++){
	  vMEM.push(0);
  }
}

function prestartprompt(){
	var cont = true;
	while(cont){
		var commandtodo = prompt("Prestart prompt, type **RUN to finish: ");
		if(commandtodo==="**RUN"){
			cont=false;
		}else{
			eval(commandtodo);
		}
	}
}

function keyPressed(){
	coms[0]=key.charCodeAt(0);
	coms[1]=1;
	DOIRQ=1;
	IRQ=0;
}

function keyReleased(){
	coms[0]=0;
	coms[1]=0;
}

function draw() {
  // put drawing code here
  if(escape != 0 && running == 1){
	  escape = 0;
  }
  while(escape == 0){
	  if(running == 1){
	  
	  //INPUT CONTROLS
	  /*if(DOIRQ){
	  	
	  }*/
	  
		  if(memory[r[R_PC]] == I_NOP){
			  escape = 1;
			  r[R_PC]+=1;
			  //alert(memory[0xFFFE]);
		  }else if(memory[r[R_PC]] == I_LD){
			  if(memory[r[R_PC] + 1] != T_NUM){
				  set_val(memory[r[R_PC] + 1], memory[r[R_PC] + 3], get_val(memory[r[R_PC] + 2], memory[r[R_PC] + 4]));
				  r[R_PC]+=5;
			  }else{
				  //ERR
				  r[R_PC]+=5;
			  }
		  }else if(memory[r[R_PC]] == I_ST){
			  
		  }else if(memory[r[R_PC]] == I_BR){
			  //BR IF_TYPE JMP_TYPE SETPCRET GOTO
			  var pass = false;
			  var pcgoto = r[R_PC]+6;
			  if(memory[r[R_PC] + 1] == T_EQ){
				  if(FL[0] == 1){
					  if(memory[r[R_PC]+2] == T_G){
						  pcgoto = get_val(memory[r[R_PC] + 4],memory[r[R_PC] + 5]);
					  }else if(memory[r[R_PC]+2] == T_LS){
						  pcgoto -= get_val(memory[r[R_PC] + 4],memory[r[R_PC] + 5]);
					  }else if(memory[r[R_PC]+2] == T_LA){
						  pcgoto += get_val(memory[r[R_PC] + 4],memory[r[R_PC] + 5]);
					  }else{
						  //ERR
					  }
				  }
			  }else if(memory[r[R_PC] + 1] == T_NE){
				  if(FL[0] == 0){
					  if(memory[r[R_PC]+2] == T_G){
						  pcgoto = get_val(memory[r[R_PC] + 4],memory[r[R_PC] + 5]);
					  }else if(memory[r[R_PC]+2] == T_LS){
						  pcgoto -= get_val(memory[r[R_PC] + 4],memory[r[R_PC] + 5]);
					  }else if(memory[r[R_PC]+2] == T_LA){
						  pcgoto += get_val(memory[r[R_PC] + 4],memory[r[R_PC] + 5]);
					  }else{
						  //ERR
					  }
				  }
			  }else if(memory[r[R_PC] + 1] == T_LT){
				  if(FL[1] == 1){
					  if(memory[r[R_PC]+2] == T_G){
						  pcgoto = get_val(memory[r[R_PC] + 4],memory[r[R_PC] + 5]);
					  }else if(memory[r[R_PC]+2] == T_LS){
						  pcgoto -= get_val(memory[r[R_PC] + 4],memory[r[R_PC] + 5]);
					  }else if(memory[r[R_PC]+2] == T_LA){
						  pcgoto += get_val(memory[r[R_PC] + 4],memory[r[R_PC] + 5]);
					  }else{
						  //ERR
					  }
				  }
			  }else if(memory[r[R_PC] + 1] == T_LE){
				  if(FL[2] == 0){
					  if(memory[r[R_PC]+2] == T_G){
						  pcgoto = get_val(memory[r[R_PC] + 4],memory[r[R_PC] + 5]);
					  }else if(memory[r[R_PC]+2] == T_LS){
						  pcgoto -= get_val(memory[r[R_PC] + 4],memory[r[R_PC] + 5]);
					  }else if(memory[r[R_PC]+2] == T_LA){
						  pcgoto += get_val(memory[r[R_PC] + 4],memory[r[R_PC] + 5]);
					  }else{
						  //ERR
					  }
				  }
			  }else if(memory[r[R_PC] + 1] == T_GT){
				  if(FL[2] == 1){
					  if(memory[r[R_PC]+2] == T_G){
						  pcgoto = get_val(memory[r[R_PC] + 4],memory[r[R_PC] + 5]);
					  }else if(memory[r[R_PC]+2] == T_LS){
						  pcgoto -= get_val(memory[r[R_PC] + 4],memory[r[R_PC] + 5]);
					  }else if(memory[r[R_PC]+2] == T_LA){
						  pcgoto += get_val(memory[r[R_PC] + 4],memory[r[R_PC] + 5]);
					  }else{
						  //ERR
					  }
				  }
			  }else if(memory[r[R_PC] + 1] == T_GE){
				  if(FL[1] == 0){
					  if(memory[r[R_PC]+2] == T_G){
						  pcgoto = get_val(memory[r[R_PC] + 4],memory[r[R_PC] + 5]);
					  }else if(memory[r[R_PC]+2] == T_LS){
						  pcgoto -= get_val(memory[r[R_PC] + 4],memory[r[R_PC] + 5]);
					  }else if(memory[r[R_PC]+2] == T_LA){
						  pcgoto += get_val(memory[r[R_PC] + 4],memory[r[R_PC] + 5]);
					  }else{
						  //ERR
					  }
				  }
			  }else if(memory[r[R_PC] + 1] == T_NC){
				  if(memory[r[R_PC]+2] == T_G){
						  //pcgoto = get_val(pc+4,pc+5);
						  //get_val(memory[r[R_PC] + 4],memory[r[R_PC] + 5]);
						  pcgoto = get_val(memory[r[R_PC] + 4],memory[r[R_PC] + 5]);
					  }else if(memory[r[R_PC]+2] == T_LS){
						  pcgoto -= get_val(memory[r[R_PC] + 4],memory[r[R_PC] + 5]);
					  }else if(memory[r[R_PC]+2] == T_LA){
						  pcgoto += get_val(memory[r[R_PC] + 4],memory[r[R_PC] + 5]);
					  }else{
						  //ERR
					  }
			  }else{
				  //ERR
			  }
			  if(memory[r[R_PC]+3] == 1){
				  r[R_PCRET]=r[R_PC]+6;
			  }
			  r[R_PC]=pcgoto;
		  }else if(memory[r[R_PC]] == I_JMP){
			  
		  }else if(memory[r[R_PC]] == I_JSR){
			  
		  }else if(memory[r[R_PC]] == I_RETS){
			  r[R_PC]=r[R_PCRET];
		  }else if(memory[r[R_PC]] == I_ADD){
			  //var temp_I_ADD_ADV = get_val(memory[r[R_PC] + 2], memory[r[R_PC] + 4]);
			  if(memory[r[R_PC] + 1] != T_NUM){
				  set_val(memory[r[R_PC] + 1], memory[r[R_PC] + 3], get_val(memory[r[R_PC] + 1], memory[r[R_PC] + 3])+get_val(memory[r[R_PC] + 2], memory[r[R_PC] + 4]));
			  }else{
				  //ERROR
			  }
			  //console.log(temp_I_ADD_ADV);
			  r[R_PC]+=5;
		  }else if(memory[r[R_PC]] == I_SUB){
			  if(memory[r[R_PC] + 1] != T_NUM){
				  set_val(memory[r[R_PC] + 1], memory[r[R_PC] + 3], get_val(memory[r[R_PC] + 1], memory[r[R_PC] + 3])-get_val(memory[r[R_PC] + 2], memory[r[R_PC] + 4]));
			  }else{
				  //ERROR
			  }
			  //console.log(temp_I_ADD_ADV);
			  r[R_PC]+=5;
		  }else if(memory[r[R_PC]] == I_SYSCALL){
			  r[R_SYSRET] = r[R_PC]+1;
			  r[R_PC]=r[R_SSK];
		  }else if(memory[r[R_PC]] == I_IRQ){
			  r[R_SYSRET] = r[R_PC]+2;
			  r[R_PC]=r[R_SSK];
		  }else if(memory[r[R_PC]] == I_INT){
			  r[R_SYSRET] = r[R_PC]+2;
			  r[R_PC]=r[R_SSK];
		  }else if(memory[r[R_PC]] == I_SSK){
			  r[R_SSK] = memory[r[R_PC] + 1];
			  r[R_PC]+=2;
		  }else if(memory[r[R_PC]] == I_SETV){
			  //SETV START END SET SKIP
			  var j=memory[r[R_PC] + 4];
			  if(memory[r[R_PC] + 1] == memory[r[R_PC] + 2]){
				  vMEM[memory[r[R_PC] + 1]] = memory[r[R_PC] + 3];
			  }else{
				  for(var i=memory[r[R_PC] + 1];i<=memory[r[R_PC] + 2];i+=j){
					  vMEM[i] = memory[r[R_PC] + 3];
				  }
			  }
			  r[R_PC]+=5;
		  }else if(memory[r[R_PC]] == I_RLV){
			  reload_video();
			  r[R_PC]+=1;
		  }else if(memory[r[R_PC]] == I_ESC){
			  escape = 1;
			  r[R_PC]+=1;
		  }else if(memory[r[R_PC]] == I_CMP){
			  //CMP TYPE_1 TYPE_2 IN_RECEIVER IN_INPUT
			  var op1 = get_val(memory[r[R_PC] + 1], memory[r[R_PC] + 3]);
			  var op2 = get_val(memory[r[R_PC] + 2], memory[r[R_PC] + 4]);
			  if(op1 == op2){
				  FL[0] = 1;
			  }else{
				  FL[0] = 0;
			  }
			  if(op1 < op2){
				  FL[1] = 1;
			  }else{
				  FL[1] = 0;
			  }
			  if(op1 > op2){
				  FL[2] = 1;
			  }else{
				  FL[2] = 0;
			  }
			  r[R_PC]+=5;
		  }else if(memory[r[R_PC]] == I_RLP){
			  reload_pixel(memory[r[R_PC] + 1], memory[r[R_PC] + 2]);
			  r[R_PC]+=3;
		  }else if(memory[r[R_PC]] == I_RCD){
		  	  //alert(coms[memory[r[R_PC]+1]]);
		  	  //alert(memory[0xFFFF]);
			  memory[memory[r[R_PC]+2]]=coms[memory[r[R_PC]+1]];
			  //alert(memory[memory[r[R_PC]+2]]);
			  r[R_PC]+=3;
		  }else if(memory[r[R_PC]] == I_CIRQ){
		  	  //if(DOIRQ>0){alert(DOIRQ);}
			  memory[memory[r[R_PC]+1]]=DOIRQ;
			  DOIRQ=0;
			  r[R_PC]+=2;
		  }else if(memory[r[R_PC]] == I_LIRQ){
			  memory[memory[r[R_PC]+1]]=IRQ;
			  r[R_PC]+=2;
		  }else if(memory[r[R_PC]] == I_BIT){
			  memory[memory[r[R_PC]+4]]=getdigit(convertToBinary(memory[memory[r[R_PC]+3]]),get_val(memory[r[R_PC]+1],memory[r[R_PC]+2]));
			  r[R_PC]+=5;
		  }else if(memory[r[R_PC]] == I_SETVT){
			  //SETV T T T T START END SET SKIP
			  var j=memory[r[R_PC] + 8];
			  if(get_val(memory[r[R_PC] + 1],memory[r[R_PC] + 5]) == get_val(memory[r[R_PC] + 2],memory[r[R_PC] + 6])){
				  vMEM[get_val(memory[r[R_PC] + 1],memory[r[R_PC] + 5])] = get_val(memory[r[R_PC] + 3],memory[r[R_PC] + 7]);
			  }else{
				  for(var i=get_val(memory[r[R_PC] + 1],memory[r[R_PC] + 5]);i<=get_val(memory[r[R_PC] + 2],memory[r[R_PC] + 6]);i+=j){
					  vMEM[i] = get_val(memory[r[R_PC] + 3],memory[r[R_PC] + 7]);
				  }
			  }
			  r[R_PC]+=9;
		  }else if(memory[r[R_PC]] == I_HALT){
			  running = 0;
			  escape = 1;
		  }
	  }else{
		  console.log("Exit Code: " + running);
	  }
  }
}
