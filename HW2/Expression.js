"use strict";
var space = ' '
var counter = -1;
var tok     //current Token
var tokens  //Token.list()
var WithOneParam,F,WithTwoParam;
function match(k) {
  if (tok.kind == k) 
    tok = tokens.pop();
  else expected(k);
}
function expected(s) {
  error(s+" expected -- "+tok+" found");
}
function error(s) {
  throw ("At index "+tok.index+": "+s);
}
function showError(elt) {
  elt.selectionStart = tok.index
  elt.selectionEnd = tok.index + tok.length
  elt.focus(); 
}

class Constant {
 constructor(num) { this.num = num; }
 fValue() { return this.num; }
 toTree(val) { return space.repeat(val) + this.num + '\n'; }
 toPostfix() { return this.num + ' '; }
 toString() { return this.num.toString(); }
}
class Binary {
 constructor(left, oper, right) {
  this.left = left; this.oper = oper; this.right = right;
}

fValue() {
  switch (this.oper) {
    case PLUS:  return this.left.fValue()+this.right.fValue();
    case MINUS: return this.left.fValue()-this.right.fValue();
    case STAR:  return this.left.fValue()*this.right.fValue();
    case POWER: return this.left.fValue()**this.right.fValue();
    case MOD: return this.left.fValue()%this.right.fValue();
    case SLASH: 
    let v = this.right.fValue();
    if (v == 0) 
      throw ("Division by zero");
    return this.left.fValue()/v;
    default: return NaN;

  }
}
toTree() {
  return space.repeat(++counter)+this.oper+'\n'+this.left.toTree(counter)+this.right.toTree(counter--);
}
toPostfix() {
  return this.left.toPostfix()+this.right.toPostfix()+this.oper+' '
}
  toString() {
  return '('+this.left + this.oper + this.right+')'
    }
}
class Unary { // for 1 parameter func
  constructor(oper, right) {
    this.oper = oper; this.right = right;
  }
  fValue() {
    return Math[this.oper](this.right.fValue());
  }

  toTree() {
    return space.repeat(++counter)+this.oper+'\n'+this.right.toTree(counter--);
  }
  toPostfix() {
    return this.right.toPostfix()+this.oper+' '
  }
  toString() {
    return  this.oper +'('+ this.right+')'
  }
}
class TwoPram {  //for funcs with 2 parameter
  constructor(left, oper, right) {
    this.left = left; this.oper = oper; this.right = right;
  }

  fValue() {
    return Math[this.oper](this.left.fValue(),this.right.fValue());
  }
  toTree() {
    return space.repeat(++counter)+this.oper+'\n'+this.left.toTree(counter)+this.right.toTree(counter--);
  }
  toPostfix() {
    return this.left.toPostfix()+this.right.toPostfix()+this.oper+' '
  }
  toString() {
    return '('+this.left + this.oper + this.right+')'
  }
}



function binary(e) {
  let op = tok.kind; match(op);
  return new Binary(e, op, term());
}
function expression() {
  let e = (tok.kind == MINUS)?
  binary(new Constant(0)) : term();
  while (tok.kind == PLUS || tok.kind == MINUS) 
    e = binary(e);
  return e;
}
function term() {
  let e = factor();
  while ( tok.kind == STAR || tok.kind == SLASH || tok.kind == POWER || tok.kind == MOD ) { //MOD added
    let op = tok.kind; match(op);
    e = new Binary(e, op, factor());
  }
  return e;
}
function factor() {

  switch (tok.kind)  {
    case NUMBER:
      let c = tok.val;
      match(NUMBER);
      return new Constant(c);

    case LEFT:
      match(LEFT); 
      let e = expression();
      match(RIGHT); 
      return e;

    case IDENT:

      F = Object.getOwnPropertyNames(Math)//get method names->to list
      WithOneParam= F.filter(k => Math[k].length==1) ; //1 parameter
      WithTwoParam= F.filter(k => Math[k].length==2) ; //2 parameters
      let k = tok.val; 
      if(WithOneParam.includes(k)){ //eg: round(2.1)
        match(IDENT);   
        match(LEFT);
        let f=expression();
        let u=new Unary( k, f);
        match(RIGHT);
        return u;
      }
      else if(WithTwoParam.includes(k)){ 
        match(IDENT);   
        match(LEFT);
        let lft=expression();
        match(COMMA);
        let rt=expression();
        let t=new TwoPram(lft, k, rt);
        match(RIGHT);
        return t;
      }   

    default: expected("Factor");
  }
  return null;

}