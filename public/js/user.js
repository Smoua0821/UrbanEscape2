function formatTime(seconds) {
  const days = String(Math.floor(seconds / (3600 * 24))).padStart(2, "0");
  const hours = String(Math.floor((seconds % (3600 * 24)) / 3600)).padStart(
    2,
    "0"
  );
  const minutes = String(Math.floor((seconds % 3600) / 60)).padStart(2, "0");
  const remainingSeconds = String(seconds % 60).padStart(2, "0");

  $(".timec.day").html(days);
  $(".timec.hour").html(hours);
  $(".timec.minute").html(minutes);
  $(".timec.second").html(remainingSeconds);

  if (seconds === 0) {
    // $(".countdown-holder").fadeOut();
    $(".restBtn").show();
    clearInterval(ctwlIvl);
  }
}

const countdownTimec = parseInt(
  document.getElementById("countdownTimec").value / 1000
);

let lastPos;
let movingPending = false;
const locationMarkerUpdate = (newPos) => {
  if (movingPending) {
    return;
  }
  movingPending = true;
  nearestPolygon();
  if (!lastPos) {
    lastPos = newPos;
  }

  const steps = 50;
  let currentStep = 0;

  const interInterval = setInterval(() => {
    currentStep++;
    const factor = currentStep / steps;
    const movableCoord = interpolate(lastPos, newPos, factor);
    marker.position = movableCoord;
    marker.setMap(map);

    if (positionRadius > 0) {
      positionCircle.setCenter(movableCoord);
    }
    if (currentStep === steps) {
      currentStep = 0;
      clearInterval(interInterval);
      lastPos = newPos;
      movingPending = false;
    }
  }, 10);

  if (isFirstTime) {
    isFirstTime = false;
    map.panTo(newPos);
    startGaming();
  }
};

let initialTime = countdownTimec;
let startTime = new Date();

const ctwlIvl = setInterval(() => {
  let currentTime = new Date();
  let elapsedTime = Math.floor((currentTime - startTime) / 1000);

  let secondsRemaining = initialTime - elapsedTime;

  if (secondsRemaining <= 0) {
    clearInterval(ctwlIvl);
    secondsRemaining = 0;
  }

  formatTime(secondsRemaining);
}, 1000);

function voeed() {
  return true;
}

if (localStorage.checkpoints && localStorage.checkpoints !== "[]") {
  try {
    const parsedCheckpoints = JSON.parse(localStorage.checkpoints);
    if (
      typeof parsedCheckpoints === "object" &&
      !Array.isArray(parsedCheckpoints)
    ) {
      localStorage.checkpoints = "[]";
    }
  } catch (e) {
    localStorage.checkpoints = "[]";
  }
} else {
  localStorage.checkpoints = "[]";
}
let checkpoints = JSON.parse(localStorage.getItem("checkpoints")) || [];

console.log(checkpoints);

function addCoords(mapId, polyId, segment) {
  let map = checkpoints.find((m) => m.mapId === mapId);
  if (!map) {
    map = { mapId, polygons: [] };
    checkpoints.push(map);
  }

  let polygon = map.polygons.find((p) => p.polyId === polyId);
  if (!polygon) {
    polygon = { polyId, segment };
    map.polygons.push(polygon);
  }

  polygon.segment = segment;
  localStorage.setItem("checkpoints", JSON.stringify(checkpoints));
}

function getLastCoords() {
  if (!localStorage.checkpoints) return 0;
  if (localStorage.checkpoints == "[object Object]")
    localStorage.checkpoints = "[]";
  const checkpoints = JSON.parse(localStorage.checkpoints);
  if (!checkpoints || checkpoints.length == 0) return 0;

  const maps = checkpoints.find((d) => d.mapId === mapParsedId);
  if (!maps) return 0;
  const polygon = maps.polygons.find(
    (p) => p.polyId === polygonCoordinates[polyIndex]._id
  );
  if (!polygon) return 0;
  return polygon.segment;
}

let mapParsedId = document.getElementById("mapParsedId").value;
let notyf;
let circleOpacity = 100;
let selectedImages = [];
let targetMission = [];
let boxIndex = 0;
readyToSaveCheckpoint = 0;
let profileImages = [];
let isFirstTimeFetchProfilePicture = 1;
const capturedPolygons = [];
let positionRadius, positionCircle;
const gameStartedServer = document.getElementById("gameStarted")?.value;
const mapParsedIdRaw = document.getElementById("mapParsedIdRaw")?.value;
document.getElementById("mapParsedIdRaw")?.remove();
document.getElementById("gameStarted")?.remove();

if (mapParsedId) {
  localStorage.setItem("lastMap", mapParsedId);
}

function renderCapturedImage() {
  if (!profileImages) {
    $("div.captured_image").html(
      "<tr><td><div class='p-2 text-center'>No Captured Image Found</div></td></tr>"
    );
    return notyf.error("No Captured Image Found");
  } else {
    $("div.captured_image").empty();
    profileImages.forEach((img) => {
      if (selectedImages.includes(img)) return;
      $("div.captured_image").append(
        `<div class='capturedUnitImage d-flex m-0 mb-2' data-id='${img}'><img src='/static/image/${img}' alt='${img}' width='100px'><div class="w-100 d-flex align-items-center justify-content-center"><button class='btn btn-primary w-50' data-id='${img}'>Select</button></div></div>`
      );
    });
    if ($(".captured_image")[0].childNodes.length == 0) {
      $(".mission-selector").hide();
      $(".mission-interface").show();
      return notyf.error("No More Images in your Profile!");
    }
    $(".mission-selector").show();
    $(".mission-interface").hide();
    $(".capturedUnitImage button.btn")
      .off("click")
      .on("click", function () {
        const tarImg = $(this).data("id");
        if (!tarImg) return;
        selectedImages.push(tarImg);
        $(".mission-interface").fadeIn();
        $(".mission-selector").hide();
        $(`.capturedUnitImage[data-id='${tarImg}']`).fadeOut(function () {
          $(this).remove();
        });
        $(`.image-picker[data-id='${boxIndex}']`).html(
          `<img src='/static/image/${tarImg}' />`
        );
        $(`.image-picker[data-id='${boxIndex}']`).off("click");
        $(`.image-picker[data-id='${boxIndex}']`).removeClass("image-picker");
        if (targetMission.images.length == selectedImages.length) {
          $(".redeem-action-bar").show();
          $(".placeholder-div-redeem").hide();
        }
      });
  }
}

const settings = {
  mapMarkerSize: 5,
};

$(document).ready(() => {
  positionRadius = parseInt($("#userLocationRadius").val());
  if (!positionRadius) positionRadius = 0;
  positionCircle = new google.maps.Circle({
    radius: positionRadius,
  });
  if (positionRadius) {
    positionCircle.setMap(map);
    console.log(positionCircle);
  }
  $(".ldrbrd_btn").click(() => {
    window.location.href = `/leaderboard/${mapParsedId}`;
  });
  $(".refresh").click(() => {
    $(".refresh span").addClass("fa-spin");
    window.location.reload();
  });
  $.get("/api/settings/import", (data) => {
    if (data && Array.isArray(data) && data.length > 0) {
      data.forEach((d) => {
        settings[d.name] = d.content;
        $(`#${d.name}`).html(d.content);
      });
      let tmpInterval;
      tmpInterval = setInterval(() => {
        if ($("#defaultMarkerIcon") && $("#defaultMarkerIcon").length > 0) {
          let tmpSize = settings.mapMarkerSize * 10;
          if (tmpSize > 100) tmpSize = 100;
          if (tmpSize < 10) tmpSize = 10;
          $("#defaultMarkerIcon").attr("width", tmpSize);
          clearInterval(tmpInterval);
        }
      }, 1000);
    }
  });
  $(".hideAllPopups").click(() => {
    $("#bsModal").modal("hide");
    $(".informationWindow").hide();
  });
  $(".fullscreen-toggle").click(() => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
      $(".fullscreen-toggle .fullscreen span").text("Full Screen");
      $("#fullscreenicon").attr("src", "/images/fullscreen.svg");
    } else {
      document.documentElement.requestFullscreen();
      $(".fullscreen-toggle .fullscreen span").text("Exit Full Screen");
    }
  });

  $.post("/api/buttons", { name: "how_to_play" }, (data) => {
    $(".user-navbar").fadeIn();
    if (data) {
      const cstdta = data;
      if ($("#isLogin").val() != "true") {
        $(".howtoplaycontainer").html(
          `<a href="${cstdta.link}">${cstdta.text}</a>`
        );
      }
    }
    $(".user-navbar .navbar-container ul li").click(function () {
      const target = $(this).data("id");
      if (!target) return;
      if (target == "/auth")
        localStorage.setItem("forceRedirect", window.location.href);
      if (target == "/missions") return $(".mission-popup").fadeIn();
      // const cnfOut = confirm(
      //   "Game Progress will be destroyed and You will lose one life, Agree?"
      // );
      // if (!cnfOut) return;
      window.location.href = target;
    });
  });
  let index = 0;
  let redeemReady = 1;
  $(".simpleLoading").show();
  $(".informationWindow .infodiscart").click(() => {
    $(".informationWindow").hide();
  });
  $(".mission-container .missions-list ul").empty();
  missions.forEach((mission) => {
    $(".mission-container .missions-list ul").append(
      `<li data-id=${++index}>${mission.name}</li>`
    );
  });
  $(".mission-container .missions-list ul li").click(function () {
    const missionId = $(this).data("id");
    if (!missionId) return;
    targetMission = missions[missionId - 1];
    if (!targetMission)
      return $(".mission-interface").hide(() => {
        $(".missions-list").fadeIn();
      });
    $(".placeholder-div-redeem").show();
    $("button.btn.redeembtn")
      .off("click")
      .on("click", function () {
        if (!redeemReady) return;
        redeemReady = 0;
        $(this).text("Please Wait ...");
        $.post("/user/redeem/route", {
          images: targetMission.images,
          secrets: selectedImages,
          mapId: mapParsedId,
          missionId: targetMission._id,
        })
          .done(function (data, textStatus, xhr) {
            const response = xhr.responseJSON || {};
            if (response.type == "badge") {
              $(".hideMissionsPopup").click();
              notyf.success("Badge Saved Successfully!");
            } else {
              window.open(response.redeemLink);
              if (xhr.status === 200) {
                notyf.success(response.message);
              }
            }
          })
          .fail(function (xhr, textStatus, errorThrown) {
            const response = xhr.responseJSON || {};
            if (xhr.status === 405) {
              notyf.error("Invalid Matching, Please Match them Correctly!");
            } else {
              notyf.error(response.message);
            }
          })
          .always(() => {
            redeemReady = 1;
            $(this).text("REDEEM");
          });
      });
    $(".missions-list").hide();
    $(".mission-interface").fadeIn();
    $(".user-image-pick").empty();
    $(".mission-container .title").text(targetMission.name);
    let index = 0;
    targetMission.images.forEach((image) => {
      $(".user-image-pick").append(
        `<div class="image-line col-6 row p-2"><div class="mission-image image-picker col-6" data-id='${++index}'></div><div class="mission-image col-6"><img src="/images/mapicons/${image}" width="100%" loading="lazy"></div></div>`
      );
    });
    $(".image-picker")
      .off("click")
      .on("click", function () {
        boxIndex = $(this).data("id");
        if (!boxIndex) return;
        renderCapturedImage();
      });
  });
  $(".backFromInterface").click(() => {
    $(".redeem-action-bar").hide();
    $(".missions-list").fadeIn();
    $(".mission-interface").hide();
    $(".mission-selector").hide();
    $(".mission-container .title").text("Missions");
    selectedImages = [];
  });
  $(".hideMissionsPopup").click(() => {
    $(".redeem-action-bar").hide();
    $(".missions-list").fadeIn();
    $(".mission-interface").hide();
    $(".mission-selector").hide();
    $(".mission-popup").fadeOut();
    selectedImages = [];
  });
  if (!mapParsedId) return false;
  notyf = new Notyf();
});
let polygonCoordinates = [];
let map, markerElement, circle, marker;
let pos = { lat: 50.46765140154505, lng: -104.61 };
let iconMarker = document.createElement("img");
let currentSegment = 0;
let currentStep = 0;
let stepsPerSegment = 100;
let speed = 10;
let gameStarted = 0;
iconMarker.width = 50;
let isFullScreen = 0;
let polyIndex = 0;
iconMarker.addEventListener("click", () => {
  InfoModal(polygonCoordinates[polyIndex]._id);
});

function getPointAtDistance(lat, lng, distanceKm, angleDeg) {
  const R = 6371;
  const latRad = (lat * Math.PI) / 180;
  const lngRad = (lng * Math.PI) / 180;
  const bearingRad = (angleDeg * Math.PI) / 180;

  const newLatRad = Math.asin(
    Math.sin(latRad) * Math.cos(distanceKm / R) +
      Math.cos(latRad) * Math.sin(distanceKm / R) * Math.cos(bearingRad)
  );

  const newLngRad =
    lngRad +
    Math.atan2(
      Math.sin(bearingRad) * Math.sin(distanceKm / R) * Math.cos(latRad),
      Math.cos(distanceKm / R) - Math.sin(latRad) * Math.sin(newLatRad)
    );

  const newLat = (newLatRad * 180) / Math.PI;
  const newLng = (newLngRad * 180) / Math.PI;
  const normalizedLng = ((newLng + 540) % 360) - 180;

  return {
    lat: newLat,
    lng: normalizedLng,
  };
}

let pacmanPositionCoord = { lat: 0, lng: 0 };
let pacmanData = {
  coords: { lat: 0, lng: 0 },
  speed: document.getElementById("pacmanSpeed")?.value
    ? document.getElementById("pacmanSpeed")?.value
    : 10,
  radius: document.getElementById("pacmanRadius")?.value
    ? document.getElementById("pacmanRadius")?.value
    : 10,
};

let isPacmanDeployed = false;

function deployPacmanOnMap() {
  if (isPacmanDeployed) return false;
  isPacmanDeployed = true;
  let pacmanPositionCoords = document.getElementById("pacmanCoordinates");

  if (pacmanPositionCoords) {
    try {
      pacmanPositionCoords = pacmanPositionCoords.value?.split(",");
      if (pacmanPositionCoords && pacmanPositionCoords.length == 2) {
        pacmanPositionCoord = getPointAtDistance(
          pos.lat,
          pos.lng,
          pacmanPositionCoords[0] / 1000,
          pacmanPositionCoords[1]
        );
        pacmanData.coords = pacmanPositionCoord;
      }
    } catch (error) {
      console.error("Invalid pacman coordinates format:", error);
    }
  }
  document.getElementById("pacmanCoordinates")?.remove();
  startMovingPacman();
}

function startMovingPacman() {
  let pacmanMarker;
  if (mapParsedIdRaw) {
    const pacmanImage = document.createElement("img");
    pacmanImage.src = `/api/pacman/character/${mapParsedId}`;
    pacmanImage.width = 50;
    pacmanMarker = new google.maps.marker.AdvancedMarkerElement({
      content: pacmanImage,
      map,
      position: pacmanPositionCoord,
    });

    // Moving Pacman Towards User
    let movingPing;
    let gameoverSafe = true;
    movingPing = setInterval(() => {
      if (!pacmanData.speed) pacmanData.speed = 1;
      if (!pacmanData.radius) pacmanData.radius = 1;
      const distance = haversineDistance(pos, pacmanPositionCoord);
      let segments = (distance * 1000) / pacmanData.speed;
      if (segments <= 0) segments = 1; // Ensure no Zero can be there
      segments *= 40; // Correcting Speed to 0.25 meter per second
      let steps = 1 / segments;
      if (steps >= 1 && gameoverSafe) {
        gameOverHandler("lose");
        gameoverSafe = false;
        steps = 1;
      }
      pacmanPositionCoord = interpolate(pacmanPositionCoord, pos, steps);
      pacmanMarker.position = pacmanPositionCoord;
      if (hasPacmanAttackedUser(pacmanData.radius / 1000) && gameoverSafe) {
        gameoverSafe = false;
        gameOverHandler("lose");
      }
    }, 100);

    const startTime = Date.now(); // Record the initial start time
    let elapsedTime = 0;
    const timeInterval = setInterval(() => {
      const currentTime = Date.now();
      elapsedTime = Math.floor((currentTime - startTime) / 1000);

      const hours = Math.floor(elapsedTime / 3600);
      const minutes = Math.floor((elapsedTime % 3600) / 60);
      const seconds = elapsedTime % 60;

      // Format time as hh:mm:ss
      const formattedHours = hours < 10 ? `0${hours}` : hours;
      const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
      const formattedSeconds = seconds < 10 ? `0${seconds}` : seconds;

      $(".time-countdown").text(
        `${formattedHours}:${formattedMinutes}:${formattedSeconds}`
      );
    }, 1000);

    async function leaderboardinfo(type = "lose") {
      let url = "/game/lose";
      if (type == "win") {
        url = "/game/win";
      }

      try {
        const response = await $.post(url, {
          mapParsedIdRaw,
          time: elapsedTime,
          type,
        });
        return response; // Properly return response
      } catch (error) {
        console.error("Request failed:", error);
        return { status: "error", message: "Something went wrong!" };
      }
    }

    gameOverHandler = async (type = "win") => {
      gameoverSafe = false;
      clearInterval(timeInterval);
      clearInterval(movingPing);
      pacmanMarker.position = pos;
      if (type == "win") {
        $(".WinScreen h2")
          .text("Congratulations!")
          .removeClass("text-danger")
          .addClass("text-success");

        $(".WinScreen").attr("style", "background: lightblue;");
      }

      let data = await leaderboardinfo(type);
      $("#userRankAfterGameOver").html(data.rank);
      $(".WinScreen").show();
    };
  }
}

function initMap() {
  map = new google.maps.Map(document.getElementById("map"), {
    zoom: 15,
    center: pos,
    mapId: "f543ed7dd1b2a7e2",
    fullscreenControl: false,
    disableDoubleClickZoom: true,
    disableDefaultUI: true,
    mapTypeControl: true,
    mapTypeControlOptions: {
      style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
      mapTypeIds: ["roadmap", "satellite", "terrain"],
    },
  });
  const defaultMarkerIcon = document.createElement("img");
  defaultMarkerIcon.id = "defaultMarkerIcon";
  defaultMarkerIcon.src = "/api/marker";
  defaultMarkerIcon.width = settings.mapMarkerSize * 10;

  marker = new google.maps.marker.AdvancedMarkerElement({
    position: pos,
    content: defaultMarkerIcon,
  });

  $.get("/user/profile/capture", { mapId: mapParsedId }, (data) => {
    if (!data.imgexist || !data.imgexist.length > 0) {
      console.log("No Picture is saved in Profile");
    } else {
      const targetPolygon = data.imgexist.find((dt) => dt.mapId == mapParsedId);
      if (!targetPolygon) return console.log("Not Played Yet!");
      profileImages = targetPolygon.images;
    }
  });
  $(".loadingScreen").hide();
  map.addListener("click", (event) => {
    if (polygonCoordinates.length == 0)
      return notyf.error("No Route Available");
    const clickedLocation = event.latLng;
    const circleLocation = circle.getCenter();
    const clickDist = haversineDistance(
      {
        lat: pos.lat,
        lng: pos.lng,
      },
      {
        lat: circleLocation.lat(),
        lng: circleLocation.lng(),
      }
    );
    const clickDist2 = haversineDistance(
      {
        lat: clickedLocation.lat(),
        lng: clickedLocation.lng(),
      },
      {
        lat: circleLocation.lat(),
        lng: circleLocation.lng(),
      }
    );

    $(".confirmCaptureContainer").hide();

    if (clickDist2 > circle.getRadius() / 1000)
      return console.log("Clicked Outside Circle");

    if (clickDist2 < circle.getRadius())
      InfoModal(polygonCoordinates[polyIndex]._id);

    if (clickDist > (circle.getRadius() + positionRadius) / 1000)
      return console.log("Your live Location is Outside Circle");

    InfoModal(polygonCoordinates[polyIndex]._id);

    $(".confirmCaptureContainer").show();
    $(".confirmCaptureContainer button.confirmCapture")
      .off("click")
      .on("click", () => {
        console.log(
          `From You: ${clickDist}   From Click: ${clickDist2}  Radii: ${
            circle.getRadius() / 1000
          }`
        );
        const ImgPath = iconMarker.src.split("/");
        $("#CapturedImagePopUp img").attr(
          "src",
          `/images/mapicons/${ImgPath[ImgPath.length - 1]}`
        );
        const polyId = polygonCoordinates[polyIndex]._id;
        $.post(
          "/user/profile/capture",
          { mapId: mapParsedId, polyId: polyId },
          (data, status, xhr) => {
            console.log(status);
            if (
              status === "success" &&
              data.message === "Image Captured successfully!"
            ) {
              $(".confirmCaptureContainer").hide();
              const checkpointIndex = checkpoints.findIndex(
                (d) => d.mapId === mapParsedId
              );
              if (checkpointIndex !== -1) {
                const polygonIndex = checkpoints[
                  checkpointIndex
                ].polygons?.findIndex((d) => d.polyId === polyId);
                if (polygonIndex !== -1) {
                  checkpoints[checkpointIndex].polygons.splice(polygonIndex, 1);
                  localStorage.setItem("checkpoints", checkpoints);
                }
              }

              profileImages.push(polyId);
              $("#CapturedImagePopUp").fadeIn();
              $("#bsModalTitle").text(data.title);
              $("#bsModal").modal("show");
              if (polygonCoordinates.length >= 0) {
                removeObjectByIndex(polygonCoordinates, polyIndex);
                if (polygonCoordinates.length == 0) return gameWon();
                polyIndex = nearestPolygon().index;
                map.panTo(polygonCoordinates[polyIndex].polygonCoords[0]);
              }
            } else {
              const errorMessage =
                data.message || "It seems You are not logged in, Please login";
              notyf.error(errorMessage);
              window.location.href = "/auth";
            }
          }
        ).fail((xhr, status, error) => {
          if (xhr.status == 369) {
            window.location.href = "/auth";
          }

          const errorMessage =
            xhr.responseJSON?.message || "An unexpected error occurred.";
          const errorCode = xhr.responseJSON?.code;

          if (errorCode === 302) {
            // Redirect only if specific error code is returned
            setTimeout(() => {
              window.location.href = "/auth";
            }, 2000);
          } else {
            // Show server error message
            notyf.error(errorMessage);
          }

          let dCode = xhr.responseJSON?.code || 0;
          if (dCode == 1) {
            if (polygonCoordinates.length > 0) {
              removeObjectByIndex(polygonCoordinates, polyIndex);
              polyIndex = nearestPolygon().index;
            }
          }
        });

        nearestPolygon();
        if (!gameStarted) {
          gameStarted = 1;
          startGaming();
        }
      });
  });
  markerElement = new google.maps.marker.AdvancedMarkerElement({
    position: pos,
    map: map,
    content: iconMarker,
  });

  circle = new google.maps.Circle({
    center: pos,
    radius: 1000,
    clickable: false,
  });
  showAllPolygons();
}
function markerClickTrack(event) {
  $(".popup-button").show();
  $(".popup-button")
    .off("click")
    .on("click", function () {
      console.log("Clicked");
      const tarId = event.target.id;
      if (!tarId) return notyf.error("No Information");
      InfoModal(tarId);
      event.preventDefault();
      $(".popup-button").hide();
      return false;
    });
}
function showAllPolygons() {
  $.get(`/api/looproute/${mapParsedId}`, (data, success) => {
    if (!success) return;
    polygonCoordinates = data?.route;
    polygonCoordinates.forEach((pl) => {
      const img = document.createElement("img");
      img.src = pl.image;
      img.width = 10 * pl.size;
      img.id = pl._id;
      img.className = "mapPolyImage";
      img.addEventListener("click", markerClickTrack);
      img.addEventListener("touchstart", markerClickTrack);
      new google.maps.marker.AdvancedMarkerElement({
        position: pl.polygonCoords[0],
        content: img,
        map: map,
      });
    });
    updateCurrentLocation();
  });
}
function removeObjectByIndex(arr, index) {
  if (index > -1 && index < arr.length) {
    arr.splice(index, 1);
  }
}
let isFirstTime = 1;
let pendingPromise = 0;

function getCurrentLocation() {
  marker.position = pos;
  marker.setMap(map);
  map.panTo(pos);
  $(".currentLocationBtn").addClass("pending");
  if (pendingPromise) return;
  return new Promise((resolve, reject) => {
    pendingPromise = 1;

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          pendingPromise = 0;
          const { latitude, longitude } = position.coords;
          pos.lat = latitude;
          pos.lng = longitude;
          const newPos = { ...pos };
          locationMarkerUpdate(newPos);
          $(".currentLocationBtn").removeClass("pending");
          map.setZoom(18);
          map.panTo(pos);
          resolve({ lat: latitude, lng: longitude });
        },
        (error) => {
          // Error: try fetching from the fallback API
          notyf.error("Can't get Location, Try Again!");

          // Fetch fallback location from the external API
          fetch("https://freeipapi.com/api/json")
            .then((response) => response.json())
            .then((data) => {
              if (data && data.latitude && data.longitude) {
                const fallbackLat = data.latitude;
                const fallbackLng = data.longitude;
                pos.lat = fallbackLat;
                pos.lng = fallbackLng;
                const newPos = { ...pos };
                locationMarkerUpdate(newPos);
                $("currentLocationBtn").removeClass("pending");
                map.panTo(pos);
                resolve({ lat: fallbackLat, lng: fallbackLng });
              } else {
                // If API doesn't return valid coordinates, reject the promise
                pendingPromise = 0;
                reject(new Error("Unable to retrieve fallback location"));
              }
            })
            .catch((err) => {
              // Handle API request failure
              pendingPromise = 0;
              notyf.error("Error fetching fallback location: " + err.message);
              reject(new Error("Error fetching fallback location"));
            });
        }
      );
    } else {
      // Reject if geolocation is not available
      notyf.error("Can't get Location, Try Again!");
      reject(new Error("Geolocation not supported by this browser"));
    }
  });
}

function updateCurrentLocation() {
  if (!navigator.geolocation) {
    notyf.error("Geolocation is not supported by this browser.");
    return;
  }

  const successCallback = (position) => {
    $(".simpleLoading").fadeOut();
    pos.lat = position.coords.latitude;
    pos.lng = position.coords.longitude;
    const newPos = { ...pos };
    locationMarkerUpdate(newPos);
    deployPacmanOnMap();
  };

  const errorCallback = (error) => {
    // If geolocation fails, attempt to fetch coordinates from the fallback API
    if (error.code !== error.TIMEOUT) {
      $(".errorScreen").show();
      $("#map").remove();
    }

    const locerrmsg =
      [
        "User denied the request for Geolocation.",
        "Location information is unavailable.",
        "The request to get user location timed out.",
        "An unknown error occurred.",
        "An error occurred while retrieving location.",
      ][error.code] || "An error occurred while retrieving location.";

    notyf.error(locerrmsg);
    $(".locerrmsg").text(locerrmsg);

    // Fallback: Get coordinates from external API
    fetch("https://freeipapi.com/api/json")
      .then((response) => response.json())
      .then((data) => {
        if (data && data.latitude && data.longitude) {
          pos.lat = data.latitude;
          pos.lng = data.longitude;
          const newPos = { ...pos };
          locationMarkerUpdate(newPos);
        } else {
          notyf.error("Unable to fetch fallback location.");
        }
      })
      .catch((err) => {
        notyf.error("Error fetching fallback location: " + err.message);
      });
  };

  const options = {
    enableHighAccuracy: true,
    timeout: 10000, // Timeout in milliseconds
    maximumAge: 0, // Do not use cached location
  };

  // Using watchPosition instead of getCurrentPosition
  navigator.geolocation.watchPosition(successCallback, errorCallback, options);
}

function interpolate(start, end, factor) {
  if (!start || !start.lat || !start.lng || !end || !end.lat || !end.lng) {
    return polygonCoordinates[polyIndex].polygonCoords[0];
  }

  return {
    lat: start.lat + (end.lat - start.lat) * factor,
    lng: start.lng + (end.lng - start.lng) * factor,
  };
}

const hasPacmanAttackedUser = (radius) => {
  if (haversineDistance(pos, pacmanPositionCoord) <= radius) {
    return true;
  }
  return false;
};

let gameOverHandler;

function gameWon() {
  markerElement.setMap(null);
  circle.setMap(null);
  gameOverHandler("win");
  return notyf.success("You Won the Game!");
}
function animateMarker() {
  if (!polygonCoordinates[polyIndex]) return;
  $(`img.mapPolyImage#${polygonCoordinates[polyIndex]._id}`).hide();
  const urlParsed = new URL(iconMarker.src);
  if (polygonCoordinates.length == 0) return gameWon();
  if (urlParsed.pathname != polygonCoordinates[polyIndex].image) {
    iconMarker.src = polygonCoordinates[polyIndex].image;
  }
  const start = polygonCoordinates[polyIndex].polygonCoords[currentSegment];
  const end = polygonCoordinates[polyIndex].polygonCoords[currentSegment + 1];

  // Calculate the interpolation factor
  const factor = currentStep / stepsPerSegment;
  const newPos = interpolate(start, end, factor);
  markerElement.position = newPos;
  circle.setCenter(newPos);
  if (polygonCoordinates[polyIndex].polygonCoords.length < currentSegment + 1) {
    currentSegment = 0;
  }
  stepsPerSegment = parseInt(
    haversineDistance(
      polygonCoordinates[polyIndex].polygonCoords[currentSegment],
      polygonCoordinates[polyIndex].polygonCoords[currentSegment + 1]
    ) *
      500 *
      (100 / speed)
  );
  if (stepsPerSegment < 30) stepsPerSegment = 30;
  currentStep++;

  // Move to next segment if current segment is done
  if (currentStep > stepsPerSegment) {
    currentStep = 0;
    currentSegment++;
    // Loop back to start if at the end of the polygon path
    if (
      currentSegment >=
      polygonCoordinates[polyIndex].polygonCoords.length - 1
    ) {
      currentSegment = 0;
    }
  }
  // Repeat animation
  if (speed > 100) speed = 100;
  if (speed < 0) speed = 0;
  if (speed > 0 && speed < 10) speed = 10;
  const moveTimer = setTimeout(animateMarker, 1000 / speed);
  if (!speed) {
    clearTimeout(moveTimer);
  }
  if (readyToSaveCheckpoint) {
    addCoords(mapParsedId, polygonCoordinates[polyIndex]._id, currentSegment);
  }
}

function haversineDistance(coords1, coords2) {
  if (!coords1 || !coords2 || !coords1.lat || !coords2.lng) return;
  const toRadians = (degrees) => degrees * (Math.PI / 180);

  const lat1 = toRadians(coords1.lat);
  const lng1 = toRadians(coords1.lng);
  const lat2 = toRadians(coords2.lat);
  const lng2 = toRadians(coords2.lng);

  const dlat = lat2 - lat1;
  const dlng = lng2 - lng1;

  const a =
    Math.sin(dlat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dlng / 2) ** 2;

  const c = 2 * Math.asin(Math.sqrt(a));

  const R = 6371;
  return R * c;
}

function nearestPolygon() {
  const tmpaihjhsg = {
    distance: 0,
    index: 0,
  };
  for (let index = 0; index < polygonCoordinates.length; index++) {
    const element = polygonCoordinates[index];

    element.polygonCoords.forEach((d) => {
      if (
        tmpaihjhsg.distance > haversineDistance(pos, d) ||
        tmpaihjhsg.distance == 0
      ) {
        tmpaihjhsg.distance = haversineDistance(pos, d);
        tmpaihjhsg.index = index;
      }
    });
  }
  if (!readyToSaveCheckpoint) {
    currentSegment = getLastCoords();
    readyToSaveCheckpoint = 1;
  }
  if (polyIndex != tmpaihjhsg.index) {
    polyIndex = tmpaihjhsg.index;
    currentSegment = getLastCoords();
    speed = polygonCoordinates[polyIndex].speed;
  }
  if (polygonCoordinates.length == 0) return;
  moveMarker(polygonCoordinates[polyIndex]);
  return tmpaihjhsg;
}
function moveMarker(data) {
  if (!iconMarker.src.match(data.image)) {
    iconMarker.src = data.image;
  }
  if (circleOpacity != data.circleOpacity) {
    circleOpacity = data.opacity;
    circle.setValues({
      fillOpacity: circleOpacity / 200,
      strokeOpacity: circleOpacity / 100,
    });
  }
  iconMarker.width = data.size * 10;
  // markerElement.position = data.polygonCoords[polyIndex];
  circle.setRadius(data.radius);
}
function startGaming() {
  if (!polygonCoordinates[polyIndex]?._id) return;
  $(`img.mapPolyImage#${polygonCoordinates[polyIndex]._id}`).hide();
  if (polygonCoordinates && polygonCoordinates.length == 0) {
    notyf.error("No Route Found!");
    return false;
  }
  speed = polygonCoordinates[polyIndex].speed;
  nearestPolygon();
  map.panTo(polygonCoordinates[polyIndex].polygonCoords[0]);
  circle.setMap(map);
  stepsPerSegment =
    haversineDistance(
      polygonCoordinates[polyIndex].polygonCoords[0],
      polygonCoordinates[polyIndex].polygonCoords[1]
    ) *
    500 *
    (2 - speed / 100);
  moveMarker(polygonCoordinates[polyIndex]);
  animateMarker();
  gameStarted = 1;
}
function InfoModal(polyid) {
  const tarPolygon = polygonCoordinates.find((d) => d._id == polyid);
  if (!tarPolygon) return notyf.error("No Information found!");
  $(".infoBoxMarkimage").attr("src", tarPolygon.image);
  $(".informationWindow .infoTitle").text(tarPolygon.title);
  $(".informationWindow p.mText").text(tarPolygon.description);
  $(".informationWindow").fadeIn();
}
