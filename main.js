/*************************************** ELEMENTS ***************************************/
const {
  ipValueEL,
  locationValueEL,
  timeZoneValueEL,
  countryValueEL,
  ipInputEl,
  formEl,
  spinnerRootEl,
} = DOM_EL;

/*************************************** GLOBAL VARAILBES  ***************************************/
let myMap = L.map("map", {
  attributionControl: false,
  zoomControl: false,
});
const ipPattern = /^((25[0-5]|(2[0-4]|1\d|[1-9]|)\d)\.?\b){4}$/;
const regexp = new RegExp(ipPattern);
const machine_ip_url = "https://api.ipify.org/?format=json";

/*************************************** FUNCTIONS ***************************************/
function createMap(currentPos) {
  myMap.remove();
  const defaultPos = [51.505, -0.09];
  const pos = currentPos || defaultPos;
  myMap = L.map("map", {
    attributionControl: false,
    zoomControl: false,
  }).setView(pos, 13);
  L.tileLayer("https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png", {
    maxZoom: 19,
  }).addTo(myMap);
  let myIcon = L.divIcon({ className: "my-div-icon" });
  L.marker(pos, { icon: myIcon }).addTo(myMap);
}

function displayInvalidIP() {
  if (ipInputEl.value === "") {
    ipInputEl.value = "";
    ipInputEl.setAttribute("placeholder", "Invalid IP Address");
    ipInputEl.classList.add("error");
    return;
  }
  ipInputEl.classList.add("error");
}

function removeInvalidIP() {
  ipInputEl.setAttribute("placeholder", "Search for any IP address or domain");
  ipInputEl.classList.remove("error");
}

function addSpinner() {
  spinnerRootEl.innerHTML = "";
  const spinner = document.createElement("div");
  spinner.setAttribute("id", "loading");
  spinnerRootEl.append(spinner);
}

function removeSpinner() {
  spinnerRootEl.innerHTML = "";
}

function pauseSpinner() {
  spinnerRootEl.innerHTML = "";
  const spinner = document.createElement("div");
  spinner.setAttribute("id", "error-loading");
  spinnerRootEl.append(spinner);
  return false;
}

function displayResult(results) {
  let { cityName, countryName, ipAddress, regionName, timeZone, zipCode } =
    results ?? {
      cityName: "-",
      countryName: "-",
      ipAddress: "-",
      regionName: "-",
      timeZone: "-",
      zipCode: "-",
    };

  timeZoneValueEL.textContent =
    timeZone === ("" || "-") ? "N/A" : `UTC ${timeZone}`;
  ipValueEL.textContent =
    ipAddress === ("" || "-") ? "___.___.___.___" : `${ipAddress}`;
  locationValueEL.textContent =
    countryName === ("" || "-")
      ? "_________"
      : `${cityName}, ${regionName} ${zipCode}`;
  countryValueEL.textContent =
    countryName === ("" || "-") ? "UNKNOWN" : `${countryName}`;
}

function setBodyHeight() {
  document.querySelector("body").style.height = `${window.innerHeight}px`;
}

function validIP(ipStr) {
  return regexp.test(ipStr);
}

function removeZeroPadding(ipAddress) {
  return ipAddress.replace(/\b0+(\d+)/g, "$1");
}

async function getMachineIP() {
  const result = await fetch(machine_ip_url);
  const data = await result.json();
  const { ip } = await data;
  return ip;
}

async function getData(ip) {
  const url = `https://freeipapi.com/api/json/${ip}`;
  const result = await fetch(url);
  const data = await result.json();
  return ({
    ipAddress,
    latitude,
    longitude,
    countryName,
    countryCode,
    timeZone,
    zipCode,
    cityName,
    regionName,
  } = await data);
}

async function formSubmitHandler(e) {
  e.preventDefault();
  let ipStr = ipInputEl.value.trim();
  ipStr = removeZeroPadding(ipStr);
  // display error and return if the ip is invalid
  if (!validIP(ipStr)) {
    displayInvalidIP();
    return;
  }
  removeInvalidIP();
  addSpinner();
  let connectionFlag = true;
  // proceed if ip is valid
  const results = await getData(ipStr).catch((err) => {
    connectionFlag = pauseSpinner();
  });
  const { latitude, longitude } = (await results) ?? {
    latitude: 0,
    longitude: 0,
  };
  const pos = [latitude, longitude];
  createMap(pos);
  displayResult(results);
  if (connectionFlag) removeSpinner();
}

async function windwoLoadHandler() {
  addSpinner();
  formEl.reset();
  setBodyHeight();
  let connectionFlag = true;
  const ip = await getMachineIP().catch((err) => {
    connectionFlag = pauseSpinner();
  });
  if (!validIP(ip)) {
    return;
  }
  const results = await getData(ip).catch((err) => {
    connectionFlag = pauseSpinner();
  });
  const { latitude, longitude } = (await results) ?? {
    latitude: 0,
    longitude: 0,
  };
  const pos = [latitude, longitude];
  createMap(pos);
  displayResult(results);
  if (connectionFlag) removeSpinner();
}

/*************************************** EVENT HANDLER ***************************************/

formEl.addEventListener("submit", formSubmitHandler);
window.addEventListener("load", windwoLoadHandler);
window.addEventListener("resize", setBodyHeight);
ipInputEl.addEventListener("input", removeInvalidIP);
