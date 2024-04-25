const express = require("express");
const bodyParser = require('body-parser');
const axios = require('axios');

const app = express();
app.use(bodyParser.json());
app.use(express.json());

const PORT = process.env.PORT || 3600;

app.listen(PORT, () => {
  console.log("Server Listening on PORT:", PORT);
});

const TokenArr = [];
app.post('/activate', (req, res) => { 


  TokenArr.push(req.body.token);

  const interval = setInterval(() => getMoisture(TokenArr), 60000);
})

let previousVal = null;

const getMoisture = async (token) => {
  const uniqueTokens = Array.from(new Set(token));
  try {
    const response = await fetch(
      "https://irrigation-esp32-default-rtdb.firebaseio.com/.json?auth=" +
        process.env.API_KEY
    );

    if (!response.ok) {
      throw new Error("Network response was not ok");
    }

    if (response.ok) {
      const jsonData = await response.json();
      if (
        previousVal === null ||
        (jsonData.moistureSensor < 60 &&
          previousVal !== null &&
          previousVal - jsonData.moistureSensor >= 2) ||
        jsonData.moistureSensor < 30
      ) {
        uniqueTokens.map((toks) =>  sendPush(jsonData.moistureSensor, toks));
      }

      if (
        jsonData.moistureSensor > 65 &&
        previousVal !== null &&
        jsonData.moistureSensor - previousVal >= 2
      ) {
        uniqueTokens.map((toks) =>  sendPush(jsonData.moistureSensor, toks));
      }

      previousVal = jsonData.moistureSensor;
    }
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};


const sendPush = (moistureSensor, token) => {
  // const currentDate = new Date();
  // const year = currentDate.getFullYear();
  // const month = (currentDate.getMonth() + 1).toString().padStart(2, "0");
  // const day = currentDate.getDate().toString().padStart(2, "0");

  // const formattedDate = `${year}-${month}-${day}`;

  console.log(token)

  const message = {
    to: token,
    sound: 'default',
    title: moistureSensor < 60 ? "Irrigation required!" : "Stop Irrigation!",
    body:  moistureSensor < 60
    ? `Moisture is getting low: ${moistureSensor}%`
    : moistureSensor === 60
    ? `Moisture is Normal: ${moistureSensor}%`
    : `Moisture is getting above Normal: ${moistureSensor}%`,
    priority: 'high',
    data: { Moisture: `${moistureSensor}`},
  };




  axios.post('https://exp.host/--/api/v2/push/send', message)
  .then(response => {
    console.log("Notification sent!");
  })
  .catch(error => {
    console.error(error);
    console.log("Error sending notification");
  });










  // fetch("https://app.nativenotify.com/api/notification", {
  //   method: "POST",
  //   headers: {
  //     "Content-Type": "application/json",
  //   },
  //   body: JSON.stringify({
  //     appId: 20386,
  //     appToken: "qkdzwVG8foXdGwb8b1Z5Wf",
  //     title: moistureSensor < 60 ? "Irrigation required!" : "Stop Irrigation!",
  //     body:
  //       moistureSensor < 60
  //         ? `Moisture is getting low: ${moistureSensor}`
  //         : moistureSensor === 60
  //         ? `Moisture is Normal: ${moistureSensor}`
  //         : `Moisture is getting above Normal: ${moistureSensor}`,
  //     dateSent: formattedDate,
  //     // pushData: { yourProperty: "yourPropertyValue" },
  //     // bigPictureURL: ""
  //   }),
  // }).then((response) => {
  //   if (!response.ok) {
  //     throw new Error("Network response was not ok");
  //   }

  //   console.log(response);
  //   return response;
  // });
};

// Set an interval to periodically check the data
// const interval = setInterval(getMoisture, 60000); // Check every minute, adjust as needed

// Optionally, you can add a signal handler to stop the script gracefully
// process.on("SIGINT", () => {
//   clearInterval(interval);
//   console.log("Script stopped gracefully");
//   process.exit(0);
// });