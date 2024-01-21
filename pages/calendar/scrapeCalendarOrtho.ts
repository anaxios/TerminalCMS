function getDaysInYear(year) {
  var date = new Date(year, 0, 1);
  var days = [];
  while (date.getFullYear() === year) {
    days.push(new Date(date));
    date.setDate(date.getDate() + 1);
  }
  return days;
}

// "https://www.holytrinityorthodox.com/calendar/calendar2.php?&scripture=$scripture"

async function getCalendar(date) {
  const month = date.getMonth() + 1;
  const today = date.getDate();
  const year = date.getFullYear();
  const dt = "0";
  const header = "1";
  const lives = "1";
  const trp = "1";
  const scripture = "1";

  try {
    const url = new URL(
      "https://www.holytrinityorthodox.com/calendar/calendar2.php"
    );
    url.searchParams.set("month", month);
    url.searchParams.set("today", today);
    url.searchParams.set("year", year);
    url.searchParams.set("dt", dt);
    url.searchParams.set("header", header);
    url.searchParams.set("lives", lives);
    url.searchParams.set("trp", trp);
    url.searchParams.set("scripture", scripture);

    console.log(url.toString());
    const request = new Request(url, {
      method: "GET",
      headers: {
        "Content-Type": "text/html",
      },
    });

    const response = await fetch(request);

    if (!response.ok) {
      return new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.text();
  } catch (error) {
    console.log(error);
  }
}

const fs = require("fs");

async function fetchCalendarData(date) {
  try {
    let data = await getCalendar(date);
    return data;
  } catch (error) {
    console.error("Error:", error);
  }
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function download(dates) {
  let res = [];
  for (let date of dates) {
    await delay(1000);
    let data = await fetchCalendarData(date);
    res.push({
      date: `${JSON.stringify(date)}`,
      data: `${JSON.stringify(data)}`,
    });
  }
  return res;
}

function writeArrayToFile(array) {
  fs.writeFileSync("./calendar.json", JSON.stringify(array));
  console.log("done");
}

function readCalendarFile() {
  const fileContent = fs.readFileSync("./calendar.json", "utf8");
  return JSON.parse(fileContent);
}

async function main() {
  console.log(readCalendarFile()[0].data);
}

const dates = getDaysInYear(2020);
main();
// (async () => {
//   const fuck = await download(dates);
//   writeArrayToFile(fuck);
// })();
