
reso-api-oauth2-server
=======

The RESO API OAuth2 Server provides authentication services for a RESO 
API Server.  

### Operation 

The RESO API OAuth2 Server can be run from the command line with the
following command:

```javascript
var oauth2Server=require("reso-api-oauth2-server");
oauth2Server();
```
The resoReverseProxy() function takes an optional argument to specify the 
configuration file.  The default for this argument is "./oauth2.conf".  An
example of overriding the default name is:

```javascript
var oauth2Server=require("reso-api-oauth2-server");
oauth2Server("./mySpecial.configuration");
```
### Configuration 

+ Working Files

You should copy the /public, /ssl and /templates (including content) from the
/samples directory into the root directory.

+ Configuration File

A text configuration file should be located in the root directory of your
project.  The default name of the file is "oauth2.conf", but this name can
be overriden when calling the resoOAuth2() method.  A sample of the 
configuration file called "oauth2.conf" can be found in the samples directory 
of this distribution.  

The following parameters are found in the configuration file:

LISTENING_DOMAIN: The dns name of the the computer that will be 
running the RESO API Reverse Proxy.  

LISTENING_PORT: The port that the RESO API Reverse Proxy will be 
listening on.

LISTEN_LATENCY: The built-in delay used to ensure that all information 
from the RESO API Server is read completely.

CACHE_LATENCY: The number for seconds that the browser will retain
query results.  If you have a high volume site, you can set this to something
like 3600 to to only hit the RESO API Server hourly.  Setting this to a low
number, such as 1, would provide near real time access to listing data.

API_DOMAIN: The dns name of the the computer that will be running the 
RESO API Server.

API_PORT: The port that the RESO API Server will be listening on.

API_PROTOCOL: The protocol that the RESO API Server is using.  Valid
values are "http" or "https".

ACCOUNT: The name of the subscriber account to use with the RESO API
Server.  

PASSWORD: The secret value to be used the subscriber account when 
accessing the RESO API Server.  

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

