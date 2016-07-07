
'use strict';

var CryptService = require('./CryptService');
var RedisControl = require('./RedisControl');
var c_service;
var redis_key;


function Session(app_key, prefix){

    c_service = new CryptService(app_key);

    redis_key = prefix+":";

    function reload(self){
       (RedisControl.get(redis_key)).then(function(reply){
           self.data = reply;
       });
    }

   this.data = {};

   this.db = function(cookie, dbindex, port, ip){
       
       if(cookie === null || typeof cookie === "undefined"){
           throw new Error("argument 1 : expected valid cookie value");
       }

       if(typeof cookie === "string" && /^(?:[a-zA-Z0-9\=]+)$/.test(cookie)){ // test as base64 encoded value
           throw new Error("invalid cookie value");
       }

       if(typeof dbindex !== "number"){
          throw new TypeError('argument 1: expected type [number] found ['+typeof(dbindex)+']');
       }

       var dbindex = dbindex || 0; // default redis DB
       var port = port || 6379; // default redis port
       var ip = ip || '127.0.0.1'; // defult redis host
       var self = this;
       
       
      if(RedisControl.isConnected()){
          RedisControl.disconnect();
       }

       return RedisControl.connect(port, ip, dbindex).then(function(connect){

           if(redis_key.indexOf(":") === (redis_key.length - 1)){
               redis_key += c_service.decrypt(cookie);
           }

           reload(self);

      });
 
   };


   this.all = function(){
        var data = this.data, all = [];
        for(var i in data){
           if(data.hasOwnProperty(i)){
              all.push(data[i]);
           }
        }
        return all;
   }

   this.get = function(key){
      var data = this.data;
      return data[key];
   };

   this.put = function(key, value){
      var data = this.data;
      data[key] = value;
      this.data[key] = value;
      RedisControl.set(redis_key, data, reload.bind(null, this));
   }

   this.del = function(key){
      var data = this.data;
      var value = data[key];
      delete this.data[key];
      RedisControl.del(key);
      return value;   
   }
  

}

module.exports = Session;
