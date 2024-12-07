function voeed() {
  return true;
}
let mapParsedId = document.getElementById("mapParsedId").value;
let notyf;
let circleOpacity = 100;
let selectedImages = [];
let targetMission = [];
let boxIndex = 0;
let profileImages = [];
let isFirstTimeFetchProfilePicture = 1;
const capturedPolygons = [];

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
        `<div class='capturedUnitImage d-flex m-0 mb-2' data-id='${img}'><img src='/static/image/${img}' alt='${img}' width='100px'><div class="w-100 d-flex align-items-center justify-content-center"><button class='btn btn-primary w-100' data-id='${img}'>Select</button></div></div>`
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
        }
      });
  }
}

$(document).ready(() => {
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
        })
          .done(function (data, textStatus, xhr) {
            const response = xhr.responseJSON || {};
            window.location.href = response.redeemLink;
            if (xhr.status === 200) {
              notyf.success(response.message);
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
        `<div class="image-line"><div class="mission-image image-picker" data-id='${++index}'></div><div class="mission-image"><img src="/images/mapicons/${image}" loading="lazy"></div></div>`
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
  $(".user-navbar .navbar-container ul li").click(function () {
    const target = $(this).data("id");
    if (!target) return;
    if (target == "/missions") return $(".mission-popup").fadeIn();
    window.location.href = target;
  });
});
let polygonCoordinates = [];
let map, markerElement, circle, marker;
let pos = { lat: 55.5, lng: 254.7 };
let iconMarker = document.createElement("img");
let currentSegment = 0;
let currentStep = 0;
let stepsPerSegment = 100;
let speed = 10;
let gameStarted = 0;
iconMarker.width = 50;
iconMarker.addEventListener("click", () => {
  InfoModal(polygonCoordinates[polyIndex]._id);
});

let polyIndex = 0;
function initMap() {
  map = new google.maps.Map(document.getElementById("map"), {
    zoom: 15,
    center: pos,
    mapId: "f543ed7dd1b2a7e2",
    fullscreenControl: false,
    disableDefaultUI: true, // Hides all default controls
    mapTypeControl: true, // Enables the map type toggle control
    mapTypeControlOptions: {
      style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR, // Options: DEFAULT, DROPDOWN_MENU, HORIZONTAL_BAR
      mapTypeIds: ["roadmap", "satellite", "terrain"], // Specify map types
    },
  });

  marker = new google.maps.marker.AdvancedMarkerElement({
    position: pos,
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
      markerElement.position
    );
    const clickDist2 = haversineDistance(
      {
        lat: clickedLocation.lat(),
        lng: clickedLocation.lng(),
      },
      markerElement.position
    );
    if (clickDist2 > circle.getRadius() / 1000)
      return console.log("Clicked Outside Circle");
    if (clickDist > circle.getRadius() / 1000) {
      InfoModal(polygonCoordinates[polyIndex]._id);
      return console.log("Your live Location is Outside Circle");
    }
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
        if (
          status === "success" &&
          data.message === "Image Captured successfully!"
        ) {
          profileImages.push(polyId);
          $("#CapturedImagePopUp").fadeIn();
          $("#bsModalTitle").text(data.title);
          $("#captureMessage").text(data.message);
          $("#bsModal").modal("show");
          if (polygonCoordinates.length > 0) {
            removeObjectByIndex(polygonCoordinates, polyIndex);
            if (polygonCoordinates.length == 0) return gameWon();
            polyIndex = nearestPolygon().index;
            map.panTo(polygonCoordinates[polyIndex].polygonCoords[0]);
          }
        } else {
          const errorMessage =
            data.message || "It seems You are not logged in, Please login";
          notyf.error(errorMessage);
          setTimeout(() => {
            return (window.location.href = "/auth");
          }, 2000);
        }
      }
    ).fail((xhr, status, error) => {
      if (xhr.status == 302) {
        // return (window.location.href = "/auth");
      }
      const errorMessage =
        xhr.responseJSON?.message || "An unexpected error occurred.";
      notyf.error(errorMessage);
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
  const tarId = event.target.id;
  if (!tarId) {
    return notyf.error("No Information");
  }
  InfoModal(tarId);
  event.preventDefault();
  return false;
}
function showAllPolygons() {
  $.get(`/api/looproute/${mapParsedId}`, (data, success) => {
    if (!success) return;
    polygonCoordinates = data;
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

function moveMarker(imageSrc, coordinates) {
  if (!iconMarker.src.match(imageSrc)) {
    iconMarker.src = imageSrc;
  }
  if (circleOpacity != polygonCoordinates[polyIndex].circleOpacity) {
    circleOpacity = polygonCoordinates[polyIndex].opacity;
    circle.setValues({
      fillOpacity: circleOpacity / 200,
      strokeOpacity: circleOpacity / 100,
    });
  }
  iconMarker.width = polygonCoordinates[polyIndex].size * 10;
  markerElement.position = coordinates[polyIndex];
  circle.setRadius(polygonCoordinates[polyIndex].radius);
}
function removeObjectByIndex(arr, index) {
  if (index > -1 && index < arr.length) {
    arr.splice(index, 1);
  }
}
let isFirstTime = 1;
let pendingPromise = 0;
function getCurrentLocation() {
  if (pendingPromise) return;
  return new Promise((resolve, reject) => {
    pendingPromise = 1;
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          pendingPromise = 0;
          notyf.success("Location Updated!");
          const { latitude, longitude } = position.coords;
          pos.lat = latitude;
          pos.lng = longitude;
          nearestPolygon();
          marker.position = pos;
          marker.setMap(map);
          map.panTo(pos);
          resolve({ lat: latitude, lng: longitude });
        },
        (error) => {
          // Error: reject with an error message
          notyf.error("Can't get Location, Try Again!");
          reject(new Error("Unable to retrieve location"));
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
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        $(".simpleLoading").fadeOut();
        pos.lat = position.coords.latitude;
        pos.lng = position.coords.longitude;
        nearestPolygon();
        marker.position = pos;
        marker.setMap(map);
        if (isFirstTime) {
          isFirstTime = 0;
          map.panTo(pos);
          startGaming();
        }
      },
      (error) => {
        $(".errorScreen").show();
        $("#map").remove();
        let locerrmsg = "";
        switch (error.code) {
          case error.PERMISSION_DENIED:
            locerrmsg = "User denied the request for Geolocation.";
            break;
          case error.POSITION_UNAVAILABLE:
            locerrmsg = "Location information is unavailable.";
            break;
          case error.TIMEOUT:
            locerrmsg = "The request to get user location timed out.";
            break;
          case error.UNKNOWN_ERROR:
            locerrmsg = "An unknown error occurred.";
            break;
          default:
            locerrmsg = "An error occurred while retrieving location.";
        }
        notyf.error(locerrmsg);
        $(".locerrmsg").text(locerrmsg);
      }
    );
    setTimeout(updateCurrentLocation, 10000);
  } else {
    notyf.error("Geolocation is not supported by this browser.");
  }
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

function gameWon() {
  const x = $(".WinScreen")[0];
  $("body").empty();
  document.body.appendChild(x);
  x.style = "";
  return notyf.success("You Won the Game!");
}
function animateMarker() {
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
  stepsPerSegment =
    haversineDistance(
      polygonCoordinates[polyIndex].polygonCoords[currentSegment],
      polygonCoordinates[polyIndex].polygonCoords[currentSegment + 1]
    ) * 500;
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
  const moveTimer = setTimeout(animateMarker, 1000 / speed);
  if (!speed) {
    clearTimeout(moveTimer);
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
  if (polyIndex != tmpaihjhsg.index) {
    polyIndex = tmpaihjhsg.index;
  }
  if (polygonCoordinates.length == 0) return;
  $(`img.mapPolyImage`).show();
  $(`img.mapPolyImage#${polygonCoordinates[polyIndex]._id}`).hide();
  return tmpaihjhsg;
}
function startGaming() {
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
    ) * 500;
  moveMarker(
    polygonCoordinates[polyIndex].image,
    polygonCoordinates[polyIndex].polygonCoords
  );
  animateMarker();
  gameStarted = 1;
}
function InfoModal(polyid) {
  const tarPolygon = polygonCoordinates.find((d) => d._id == polyid);
  if (!tarPolygon) return notyf.error("No Information found!");
  $(".infoBoxMarkimage").attr("src", tarPolygon.image);
  $(".informationWindow .infoTitle").text(tarPolygon.title);
  $(".informationWindow p").text(tarPolygon.description);
  $(".informationWindow").fadeIn();
}
