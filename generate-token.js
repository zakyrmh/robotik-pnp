// generate-token.js
import { google } from 'googleapis';
import { join } from 'path';
import { readFileSync } from 'fs';
import { createInterface } from 'readline';

const KEYFILEPATH = join(__dirname, 'oauth-credentials.json');
const SCOPES = ['https://www.googleapis.com/auth/drive.file'];

const credentials = JSON.parse(readFileSync(KEYFILEPATH)).installed;
const { client_secret, client_id, redirect_uris } = credentials;
const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
});

async function generateToken() {
  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });

  console.log('Authorize this app by visiting this url:', authUrl);

  rl.question('Enter the code from that page here: ', async (code) => {
    rl.close();
    try {
      const { tokens } = await oAuth2Client.getToken(code);
      oAuth2Client.setCredentials(tokens);
      console.log('\nSUCCESS! Your tokens are:');
      console.log(tokens);
      console.log('\nCOPY THE REFRESH TOKEN BELOW and add it to your .env.local file:');
      console.log('----------------------------------------------------');
      console.log('GOOGLE_REFRESH_TOKEN=' + tokens.refresh_token);
      console.log('----------------------------------------------------');
    } catch (err) {
      console.error('Error retrieving access token', err);
    }
  });
}

generateToken();