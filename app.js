const express = require("express");

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3600;

app.listen(PORT, () => {
  console.log("Server Listening on PORT:", PORT);
});

let previousVal = null;

const getMoisture = async () => {
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
        sendPush(jsonData.moistureSensor);
      }

      if (
        jsonData.moistureSensor > 65 &&
        previousVal !== null &&
        jsonData.moistureSensor - previousVal >= 2
      ) {
        sendPush(jsonData.moistureSensor);
      }

      previousVal = jsonData.moistureSensor;
    }
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};
getMoisture();

const sendPush = (moistureSensor) => {
  const currentDate = new Date();
  const year = currentDate.getFullYear();
  const month = (currentDate.getMonth() + 1).toString().padStart(2, "0");
  const day = currentDate.getDate().toString().padStart(2, "0");

  const formattedDate = `${year}-${month}-${day}`;
  fetch("https://app.nativenotify.com/api/notification", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      appId: 20386,
      appToken: "qkdzwVG8foXdGwb8b1Z5Wf",
      title: moistureSensor < 60 ? "Irrigation required!" : "Stop Irrigation!",
      body:
        moistureSensor < 60
          ? `Moisture is getting low: ${moistureSensor}`
          : moistureSensor === 60
          ? `Moisture is Normal: ${moistureSensor}`
          : `Moisture is getting above Normal: ${moistureSensor}`,
      dateSent: formattedDate,
      // pushData: { yourProperty: "yourPropertyValue" },
      // bigPictureURL: ""
    }),
  }).then((response) => {
    if (!response.ok) {
      throw new Error("Network response was not ok");
    }

    console.log(response);
    return response;
  });
};

// Set an interval to periodically check the data
const interval = setInterval(getMoisture, 60000); // Check every minute, adjust as needed

// Optionally, you can add a signal handler to stop the script gracefully
// process.on("SIGINT", () => {
//   clearInterval(interval);
//   console.log("Script stopped gracefully");
//   process.exit(0);
// });
