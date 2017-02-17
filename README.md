# laravel-sessdata

A simple way to access and update Laravel application session data from a NodeJS application

   [NPM][npm-url]
   
   [Download][downloads-url]

## Installation

```bash
$ npm install laravel-sessdata
```  

## Usage

```js

/**
 * It might be easier to supply the app key and cache config prefix using
 * the popular dotenv module so the values can be accessed like so: 
 *
 *    - process.env.LARAVEL_APP_KEY
 *    - process.env.CACHE_KEY_PREFIX
 *
 * Note: laravel-sessdata requires that on a standard HTTP request, the 
 *       cookie for the laravel session is available else the package
 *       will fail to retrieve session data.  
 *
 */

'use strict'; 

var sess = require('laravel-sessdata')( {{ YOUR LARAVEL_APP_KEY }} , {{ YOUR CACHE_KEY_PREFIX }} );

// set up the redis end (this should be the same as the Laravel session store you have set up)
// the first argument is required (laravel session cookie value), the rest are optional depending 
// on your configurations. The second argument is the redis DB index, the third is the DB port number, 
// the last argument is the IP address. 
sess.db({{ YOUR LARAVEL_SESSION_COOKIE_VALUE }}, 0, 6379, '127.0.0.1').then(function(){

      // retrieve all values at once (without keys)
      var all = sess.all();

      if(all.length > 5){
         var value2 = all.splice(0, 1);
      }

      // retrieve a single value via key
      var value3 = sess.get('key');

      // insert a single value via key
      var key1 = sess.put('key', 'value');

      // delete a single value via key
      var value4 = sess.poof('key'); 
      
});      
```

## Support

  * Makes use of the configured redis store for Laravel application
  * Works with Laravel 4.* and 5.* 
  
## Build (for Devs only)

  To build right from the repo (in case you would like to make contributions or peruse the code):

```bash
$ git clone git://github.com/isocroft/laravel-sessdata.git
$ cd laravel-sessdata
$ npm install
```

## Tests (for Devs only)

  Sorry, no tests setup at the moment (but you can help out...).

## License

  MIT LICENSE

[npm-url]: https://npmjs.com/package/laravel-sessdata
[downloads-url]: https://npmjs.com/package/laravel-sessdata
