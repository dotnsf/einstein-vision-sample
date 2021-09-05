//. app.js
var express = require( 'express' ),
    jwt = require( 'jsonwebtoken' ),
    request = require( 'request' ),
    app = express();

var settings = require( './settings' );

//. env values
var settings_einstein_vision_account_id = 'EINSTEIN_VISION_ACCOUNT_ID' in process.env ? process.env.EINSTEIN_VISION_ACCOUNT_ID : settings.einstein_vision_account_id; 
var settings_einstein_vision_url = 'EINSTEIN_VISION_URL' in process.env ? process.env.EINSTEIN_VISION_URL : settings.einstein_vision_url; 
var settings_einstein_vision_private_key = 'EINSTEIN_VISION_PRIVATE_KEY' in process.env ? process.env.EINSTEIN_VISION_PRIVATE_KEY : settings.einstein_vision_private_key; 

//. Access token
var access_token = null;
if( settings_einstein_vision_account_id && settings_einstein_vision_url && settings_einstein_vision_private_key ){
  var rsa_body = {
    sub: settings_einstein_vision_account_id,
    aud: settings_einstein_vision_url + 'v2/oauth2/token'
  };
  var rsa_option = {
    header: {
      alg: 'RS256',
      typ: 'JWT'
    },
    expiresIn: '1h'
  };
  var assertion = jwt.sign( rsa_body, settings_einstein_vision_private_key, rsa_option );

  var option = {
    url: settings_einstein_vision_url + 'v2/oauth2/token',
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      accept: 'application/json'
    },
    json: true,
    form: {
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: encodeURIComponent( assertion )
    }
  };
  request( option, function( err, response, body ){
    if( err ){
      console.log( { err } );
    }else{
      //console.log( body );
      access_token = body.access_token;
      //console.log( 'access_token = ' + access_token );
      console.log( 'ready.' );
    }
  });
}

app.use( express.Router() );

app.get( '/', async function( req, res ){
  res.contentType( 'application/json; charset=utf-8' );

  if( access_token ){
    var url = req.query.url ? req.query.url : '';
    if( url ){
      var form_data = {
        modelId: 'GeneralImageClassifier',
        sampleLocation: url
      };
      var option = {
        url: settings_einstein_vision_url + 'v2/vision/predict',
        method: 'POST',
        headers: {
          Authorization: 'Bearer ' + access_token,
          'Content-Type': 'multipart/form-data',
          Connection: 'keep-alive',
          'Cache-Control': 'no-cache'
        },
        formData: form_data
      };
      request( option, function( err, response, body ){
        if( err ){
          console.log( err );
          res.write( JSON.stringify( { status: false, error: err }, null, 2 ) );
          res.end();
        }else{
          body = JSON.parse( body );
          res.write( JSON.stringify( { status: true, body: body }, null, 2 ) );
          res.end();
        }
      });
    }else{
      res.status( 400 );
      res.write( JSON.stringify( { status: false, error: 'no url' }, null, 2 ) );
      res.end();
    }
  }else{
    res.status( 400 );
    res.write( JSON.stringify( { status: false, error: 'no access_token' }, null, 2 ) );
    res.end();
  }
});


var port = process.env.PORT || 8080;
app.listen( port );
console.log( "server starting on " + port + " ..." );
