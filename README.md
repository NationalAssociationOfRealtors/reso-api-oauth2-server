
reso-api-oauth2-server
=======

The RESO API OAuth2 Server provides authentication and authorization services for a RESO API Server.  The server features separate Admin and External interfaces so that firewalls can keep the services separate.  Authentication is targeted at end user credentials.  Authroization is targeted at giving others the right to use your credential.

### Operation 

The RESO API OAuth2 Server can be run from Javascript with the following:

```javascript
var oauth2Server=require("reso-api-oauth2-server");
oauth2Server();
```
All communications are carried out with HTTPS.

+ OAuth2 Service

  This service is intended to provide OAuth2 authorization facilities to RETS Web API Clients and Servers.  Typically, the domain and port are configured to allow outside access to the OAuth2 Service.  In the configuration file, the parameters that control this are called EXTERNAL_DOMAIN and EXTERNAL_PORT.  The authorization service has been tested against the Open Source RESO Web API Server.

+ Admin Service

  This service is intended to provide authentication and administrative facilities to RETS Web API Servers.  Typically, the domain and port are configured to only allow inside access to the Admin Service.  In the configuration file, the parameters that control this are called ADMIN_DOMAIN and ADMIN_PORT.  The authentication service has been tested against the Open Source RESO Web API Server which uses this server to perform its Digest or Basic authenticatin process.  The administrative capabilites include CRUD functions for accounts.

### Setup 

The following procedure should be followed to setup the server:

+ Install server using NPM:

 ```shell
  npm install reso-api-oauth2-server
 ```
 
+ Create Working Files

You should copy the /public and /ssl (including content) from the /samples directory into the root directory.

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

+ Admin Service

  ADMIN_DOMAIN: The dns name of the the computer that will be running the Admin iinterface to the RESO OAuth2 Server.  

  ADMIN_PORT: The port that the Admin interface to the RESO OAuth2 Server will be listening on.

+ OAuth2 Service

  EXTERNAL_DOMAIN: The dns name of the the computer that will be running the RESO OAuth2 Server.  

  EXTERNAL_PORT: The port that the RESO OAuth2 Server will be listening on.

+ White Label 

  DISPLAY_FOOTER: HTML that appears at the bottom of eac page.  If no value is givern, a default message appears.

  SERVER_NAME: Name that appears through the HTML title tag and other places that require a server name.  If no value is givern, a default name appears.

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

