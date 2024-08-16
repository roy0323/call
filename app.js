require('dotenv').config();
const twilio = require('twilio');
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
 
// Access Twilio credentials from environment variables
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = new twilio(accountSid, authToken);
 
const fromNumber = process.env.TWILIO_PHONE_NUMBER;
const toNumber = process.env.TO_PHONE_NUMBER;
 
if (!toNumber || !fromNumber || !accountSid || !authToken) {
    console.error('One or more environment variables are missing.');
    process.exit(1);
}
 
console.log('Calling number:', toNumber);
console.log('From number:', fromNumber);
 
// The URL of the audio file for the IVR call
const audioUrl = 'https://onedrive.live.com/?authkey=%21AEm9E0JuXEPP2EE&id=6D834994D9580DCB%21245717&cid=6D834994D9580DCB&parId=root&parQt=sharedby&o=OneUp';
 
// The personalized interview link
const interviewLink = 'https://v.personaliz.ai/?id=9b697c1a&uid=fe141702f66c760d85ab&mode=test';
 
// Create the IVR call
const ngrokUrl = ' https://5c7d-2409-40d0-1161-cb5-19a5-62db-97c5-7d22.ngrok-free.app';
 
client.calls
  .create({
    url: `${ngrokUrl}/ivr-response`,
    to: toNumber,
    from: fromNumber,
    method: 'GET'
  })
  .then(call => {
    console.log(`Call initiated with SID: ${call.sid}`);
  })
  .catch(err => {
    console.error('Error initiating call:', err);
  });
 
// Middleware for parsing body
app.use(bodyParser.urlencoded({ extended: false }));
 
// Handle IVR response
app.get('/ivr-response', (req, res) => {
  console.log('Received call, playing audio...');
  const twiml = new twilio.twiml.VoiceResponse();
 
  // Play the audio file
  twiml.play(audioUrl);
 
  // Gather input from the user
  const gather = twiml.gather({
      numDigits: 1,
      action: '/gather',
      method: 'POST'
  });
 
  res.type('text/xml');
  res.send(twiml.toString());
});
 
 
// Handle gathered input
app.post('/gather', (req, res) => {
    const twiml = new twilio.twiml.VoiceResponse();
 
    const selectedOption = req.body.Digits;
 
    if (selectedOption == '1') {
        // Send SMS with the interview link
        client.messages
          .create({
            body: `Thank you for your interest! Here is your personalized interview link: ${interviewLink}`,
            to: toNumber,
            from: fromNumber
          })
          .then(message => console.log(`Message sent with SID: ${message.sid}`))
          .catch(err => console.error('Error sending message:', err));
 
        twiml.say('Thank you for your interest. You will receive a message with the interview link shortly.');
    } else {
        twiml.say('You pressed an invalid key.');
    }
 
    twiml.hangup();
 
    res.type('text/xml');
    res.send(twiml.toString());
});
 
// Start the Express server
app.listen(3001, () => {
    console.log('Server is listening on port 3001');
});