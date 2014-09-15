
reso-api-oauth2-server
=======

The RESO API OAuth2 Server provides authentication services for a RESO API Server.  

### Operation 

The RESO API OAuth2 Server can be run from Javascript with the following:

```javascript
var oauth2Server=require("reso-api-oauth2-server");
oauth2Server();
```

### Setup 

The following procedure should be followed to setup the server:

+ Install server using NPM:

 ```shell
  npm install reso-api-oauth2-server
 ```
 
+ Create Working Files

You should copy the /public, /views and /ssl (including content) from the /samples directory into the root directory.

+ Create a configuration file or use the sample file supplied by the distribution:

 ```shell
  cp ../node_modules/reso-api-oauth2-server/samples/service.conf . 
 ```

+ Configure the server using the guide below in the **Configuration** section.

+ Create an execution javascript file for node.js or use the test file supplied by the distribution:

 ```shell
  cp ./node_modules/reso-api-oauth2-server/test.js .
 ```

+ Run the server:

 ```shell
  node test.js
 ```

### Configuration 

A text configuration file should be located in the root directory of your
project.  The default name of the file is "service.conf".  A sample of the 
configuration file called "service.conf" can be found in the samples directory 
of this distribution.  

The following parameters are found in the configuration file:

+ OAuth2 Service

  LISTENING_DOMAIN: The dns name of the the computer that will be running the RESO OAuth2 Server.  

  LISTENING_PORT: The port that the RESO OAuth2 Server will be listening on.

+ Data Processing 

  MONGOOSE_URI: The URI of the underlying MongoDB database.

+ HTTPS Certificates 

 SERVER\_CERTIFICATE: The path to the file that contains the server's certficate.

 SERVER\_KEY: The path to the file that contains the server's secret key.

+ Authentication 

  TOKEN_EXPIRY: The number of seconds that a generated token will be valid.

### License

>The MIT License (MIT)
>
>Copyright (c) 2014 National Association of REALTORS 
>
>Permission is hereby granted, free of charge, to any person obtaining a copy
>of this software and associated documentation files (the "Software"), to deal
>in the Software without restriction, including without limitation the rights
>to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
>copies of the Software, and to permit persons to whom the Software is
>furnished to do so, subject to the following conditions:
>
>The above copyright notice and this permission notice shall be included in
>all copies or substantial portions of the Software.
>
>THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
>IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
>FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
>AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
>LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
>OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
>THE SOFTWARE.

