// // "https://www.holytrinityorthodox.com/calendar/calendar2.php?&scripture=$scripture"

// async function getCalendar(date) {
//   const month = date.getMonth() + 1;
//   const today = date.getDate();
//   const year = date.getFullYear();
//   const dt = "0";
//   const header = "1";
//   const lives = "1";
//   const trp = "1";
//   const scripture = "1";

//   try {
//     const url = new URL(
//       "https://www.holytrinityorthodox.com/calendar/calendar2.php"
//     );
//     url.searchParams.set("month", month);
//     url.searchParams.set("today", today);
//     url.searchParams.set("year", year);
//     url.searchParams.set("dt", dt);
//     url.searchParams.set("header", header);
//     url.searchParams.set("lives", lives);
//     url.searchParams.set("trp", trp);
//     url.searchParams.set("scripture", scripture);

//     console.log(url.toString());
//     const request = new Request(url, {
//       method: "GET",
//       headers: {
//         "Content-Type": "text/html",
//       },
//     });

//     const response = await fetch(request);

//     if (!response.ok) {
//       return new Error(`HTTP error! status: ${response.status}`);
//     }

//     return await response.text();
//   } catch (error) {
//     console.log(error);
//   }
// }

// const fs = require("fs");

// async function fetchCalendarData(date) {
//   try {
//     let data = await getCalendar(date);
//     return data;
//   } catch (error) {
//     console.error("Error:", error);
//   }
// }

// function delay(ms) {
//   return new Promise((resolve) => setTimeout(resolve, ms));
// }

// async function download(dates) {
//   let res = [];
//   for (let date of dates) {
//     await delay(1000);
//     let data = await fetchCalendarData(date);
//     res.push({
//       date: `${date}`,
//       data: `${data}`,
//     });
//   }
//   return res;
// }

// function writeArrayToFile(array) {
//   fs.writeFileSync("./calendar.json", JSON.stringify(array));
//   console.log("done");
// }
import { strict as assert } from "assert";
import { stripHtml } from "string-strip-html";
import sqlite3 from "sqlite3";
import fs from "fs";
import { createClient } from "@libsql/client";
import env from "dotenv";
env.config();

function readCalendarFile(file) {
  const fileContent = fs.readFileSync(file, "utf8");
  return JSON.parse(fileContent);
}

async function makeArrayfromJSONFile(file) {
  let calendarData = file;
  let res = [];
  for (let day of calendarData) {
    let thing = day.data;
    let thing1 = thing.split(
      '<p class="ptroparionheader"><span class="troparionheader">Troparia</span></p>'
    );
    const troparion = thing1.pop();
    //console.log(troparion);
    let thing2 = thing1[0].split(
      '<p class="pscriptureheader"><span class="scriptureheader">The Scripture Readings</span></p>'
    );
    const scripture = thing2.pop();
    //console.log(scripture);
    let thing3 = thing2[0].split(
      '<p class="pscriptureheader"><span class="scriptureheader">The Scripture Readings</span></p>'
    );
    const saints = thing3.pop();
    //console.log(saints);
    res.push({
      date: new Date(day.date).toISOString().split("T")[0],
      troparion: stripHtml(troparion).result,
      scripture: stripHtml(scripture).result,
      saints: stripHtml(saints).result,
    });
  }
  return res;
}

async function createDatabase() {
  let db = new sqlite3.Database("./database2.db", (err) => {
    if (err) {
      return console.error(err.message);
    }
    console.log("Connected to the in-memory SQlite database.");
  });

  const table = db.get(
    `SELECT name FROM sqlite_master WHERE type='table' AND name='SaintsCalendar'`,
    (err, row) => {
      if (err) {
        console.error(err.message);
        return;
      }
      return row;
    }
  );

  assert(!!table);

  if (!table) {
    db.run(
      `CREATE TABLE SaintsCalendar (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT UNIQUE,
    saints TEXT,
    troparion TEXT,
    scripture TEXT);`,
      (err) => {
        if (err) {
          console.log(err);
        }
      }
    );
  }
  return db;
}

async function insert(db, data) {
  let sql = `INSERT INTO SaintsCalendar(date, saints, troparion, scripture) VALUES(?, ?, ?, ?)`;

  await db.run(
    sql,
    [data.date, data.saints, data.troparion, data.scripture],
    function (err) {
      if (err) {
        return console.error(err.message);
      }
      console.log(`A row has been inserted with rowid ${this.lastID}`);
    }
  );
}

function select(db, date) {
  let sql = `SELECT * FROM SaintsCalendar WHERE date = ?`;
  db.get(sql, [date], function (err, row) {
    if (err) {
      return console.error(err.message);
    }
    return row;
  });
}

function getDaysInYear(year) {
  var date = new Date(year, 0, 1);
  var days = [];
  while (date.getFullYear() === year) {
    days.push(new Date(date));
    date.setDate(date.getDate() + 1);
  }
  return days;
}

// // (async () => {
// //   const fuck = await download(dates);
// //   writeArrayToFile(fuck);
// // })();

// // });
// ########################################################################

(async () => {
  // we have our array of formatted calendar
  assert(!!process.env.TURSO_AUTH_TOKEN);

  const fart = await makeArrayfromJSONFile(
    await readCalendarFile("./orig_calendar.json")
  );
  assert(Array.isArray(fart));
  assert(fart[0].date === "2020-01-01");
  assert(fart[0].scripture === "Hebrews 5:11-6:8 Mark 10:11-16");

  const client = createClient({
    url: "libsql://saints-calendar-anaxios.turso.io",
    authToken: process.env.TURSO_AUTH_TOKEN,
  });
  // create database
  // const db = await createDatabase();
  // assert(!!db);
  // assert(!!db);
  const farts = fart.map((data) => {
    return () => {
      return new Promise(async (resolve, reject) => {
        client.execute({
          sql: "INSERT OR IGNORE INTO SaintsCalendar(date, saints, troparion, scripture) VALUES(?, ?, ?, ?)",
          args: [data.date, data.saints, data.troparion, data.scripture],
        });
        console.log("inserted ", data.date);
      });
    };
  });

  const sendRequest = () => {
    return new Promise((resolve) => {
      setTimeout(() => {
        console.log("request sent");
        resolve();
      }, 1000 * 30);
    });
  };

  const splitArrayIntoChunks = (array, chunkSize) => {
    if (
      !Array.isArray(array) ||
      typeof chunkSize !== "number" ||
      chunkSize <= 0
    ) {
      throw new Error("Invalid arguments");
    }

    return Array.from({ length: Math.ceil(array.length / chunkSize) }, (v, i) =>
      array.slice(i * chunkSize, i * chunkSize + chunkSize)
    );
  };

  //console.log(await farts.map((f) => f()));

  const fartsplit = splitArrayIntoChunks(farts, 10);
  //const batches = Array(1).fill(fartsplit);

  console.log(fartsplit);
  const res = [];
  for (const batch of fartsplit) {
    try {
      console.log("-- sending batch --");
      res.push(
        await Promise.allSettled(batch.map((f) => f() && sendRequest()))
      );
      console.log("-- batch done --");
    } catch (err) {
      console.error(err);
    }
  }
  console.log(res);
  // const row = select(db, "*");
  // assert(!!row);
  // console.log(row);
  // db.close();
})();

export {};
