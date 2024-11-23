const notyf = new Notyf();
let isClosedPath = 0;
let maps = [];
let map, marker, polygon, circle, iconMarker, radius;
let polyCoords = [];
let speed = 1;
let tmpImg;
const beachFlagImg = document.createElement("img");
let pos = { lat: 55.5, lng: 254.7 };
let mapId = 0;
let circleOpacity = 100;
const missions = { redeemLink: "", name: "", images: [] };
$(".mission-icons div.mission-icon-select").click(function () {
  const imgSrc = $(this).data("src");
  if (!imgSrc) return;
  // if (missions.images.includes(imgSrc)) return;
  missions.images.push(imgSrc);
  // $(this).fadeOut();
  $("#selectedImagesCount").text(missions.images.length);
  missions.images.length > 0
    ? $(".missionBtnSave").fadeIn()
    : $(".missionBtnSave").hide();
});
const setCircleOpacity = (event) => {
  circleOpacity = parseInt(event.value);
  if (circleOpacity < 0 && circleOpacity.value) {
    circleOpacity = 100;
    event.value = 100;
  }
  payloadData.opacity = circleOpacity;
  circle.setValues({
    fillOpacity: circleOpacity / 200,
    strokeOpacity: circleOpacity / 100,
  });
};
const setMarkerSpeed = (event) => {
  speed = event.value;
  if (speed < 1) {
    event.value = 1;
  } else if (speed > 10) {
    event.value = 10;
  }
  speed = event.value;
  payloadData.speed = speed;
};
const setMarkerSize = (event) => {
  let size = parseInt(event.value);
  if (size < 1) {
    size = 1;
  }
  if (size > 10) {
    size = 10;
  }
  payloadData.size = size;
  $("#sizeNum").val(size);
  beachFlagImg.width = size * 10;
};
const setMarkerSizeNum = (event) => {
  let size = parseInt(event.value);
  if (size < 1) {
    size = 1;
  }
  if (size > 10) {
    size = 10;
  }
  $("#sizeRange").val(size);
  beachFlagImg.width = size * 10;
};
const setMapRadius = (event) => {
  circle.setCenter(polyCoords[0]);
  radius = Math.pow(event.value / 10, 1.5) * (1000 / map.getZoom());
  $("#radiusNum").val(event.value);
  circle.setRadius(radius);
  circle.setMap(map);
  payloadData.radius = parseInt(radius);
};
const setMapRadiusNum = (event) => {
  if (event.value > 1000) {
    event.value = 1000;
  }
  circle.setCenter(polyCoords[0]);
  radius = Math.pow(event.value / 10, 1.5) * (1000 / map.getZoom());
  $("#radiusRange").val(event.value);
  circle.setRadius(radius);
  circle.setMap(map);
  payloadData.radius = parseInt(radius);
};
let payloadData = {
  polygonCoords: polyCoords,
  image: beachFlagImg.src,
  radius: radius,
  speed: speed,
};
$("#routeDescription")
  .off("input")
  .on("input", function () {
    const value = $(this).val();
    payloadData.description = value.trim();
  });
$("#routeTitle")
  .off("input")
  .on("input", function () {
    const value = $(this).val();
    payloadData.title = value.trim();
  });
$(".save_final").click(() => {
  if (
    payloadData.polygonCoords.length > 2 &&
    payloadData.radius > 0 &&
    payloadData.image &&
    payloadData.speed &&
    payloadData.title &&
    payloadData.description
  ) {
    payloadData.polygonCoords = polyCoords;
    $.post("/admin/looproute", payloadData, (success, data) => {
      if (success) {
        notyf.success("New Route added successfully!");
        $("#savePolyModal").modal("hide");
        marker.setMap(null);
        iconMarker.setMap(null);
        polygon.setMap(null);
        circle.setMap(null);

        new google.maps.Polyline({
          path: payloadData.polygonCoords,
          map: map,
        });
        new google.maps.Circle({
          center: payloadData.polygonCoords[0],
          map: map,
          radius: payloadData.radius,
        });
      }
    });
    $(".icon-selector").removeClass("active");
    polyCoords = [];
    $(".map-controller").fadeOut();
  } else {
    notyf.error("Invalid Configuration!");
  }
});
$(".icon-selector").click(function () {
  $(".icon-selector").removeClass("active");
  $(this).addClass("active");
  if (!$(this).data("src")) {
    $("#image-upload").click();
    return;
  }
  iconMarker.setMap(map);
  iconMarker.position = polyCoords[0];
  beachFlagImg.width = 50;
  beachFlagImg.src = $(this).data("src");
  payloadData.image = $(this).data("src");
});
$(".map-controller .undo").click(() => {
  isClosedPath = 0;
  polyCoords.pop();
  circle.setMap(null);
  polygon.setPath(polyCoords);
  marker.position = polyCoords[polyCoords.length - 1];
  if (polyCoords.length == 0) {
    $(".map-controller").hide();
    marker.setMap(null);
  }
});
$(".map-controller .save").click(() => {
  if (isClosedPath) {
    $("#savePolyModal").modal("show");
  } else {
    notyf.error("Please Close the path before saving...");
  }
});
$(".map-controller .cpath").click(() => {
  $("btn.undo").hide();
  if (isClosedPath) return;
  if (polyCoords[0] != polyCoords[polyCoords.length - 1]) {
    polyCoords.push(polyCoords[0]);
    isClosedPath = 1;
    polygon.setPath(polyCoords);
    marker.setMap(null);
  }
});
function saveMission() {
  if (!mapId) return notyf.error("Invalid MapId");
  const missionName = $("#missionname").val();
  const missionUrl = $("#missionurl").val();
  if (!missionName || !missionUrl || missions.images.length == 0)
    return notyf.error("Name or URL can't be Empty");

  missions.redeemLink = missionUrl;
  missions.name = missionName;
  $.post(
    "/admin/map/missions",
    { mapId: mapId, missions: missions },
    (data) => {
      maps.maps.find((d) => d.id === mapId).missions = data.data;
      renderMapMissions();
      $(".missionsHandler").hide();
      $(".new_map_form").fadeIn();
      missions.redeemLink = "";
      missions.name = "";
      missions.images = [];
      $("#missionname").val("");
      $("#missionurl").val("");
      $(".mission-icons div.mission-icon-select").show();
      notyf.success("Missions Added");
    }
  );
}
$(document).ready(() => {
  fetchMaps();
  $("form.new_map_form").submit(function () {
    const mapName = $("form.new_map_form input#name").val();
    if (!mapName) alert("Please Enter a Valid Name");
    $.post("/admin/map", { name: mapName }, (data) => {
      if (data.status == "success") {
        notyf.success(`Form '${mapName}' created successfully!`);
        fetchMaps();
        $("form.new_map_form input#name").val("");
      }
    });
    return false;
  });
  $("#image-upload").on("change", function (e) {
    const file = e.target.files[0];
    if (!file) {
      notyf.error("Upload Valid Image");
      return;
    }
    const formData = new FormData();
    formData.append("image", file);
    $.ajax({
      url: "/admin/looproute/image",
      method: "POST",
      data: formData,
      contentType: false,
      processData: false,
      success: function (response) {
        if (response && response.imageName) {
          $(this).data("src", response.imageName);
          $(".icon-container")
            .prepend(`<div class="p-2 border-1 rounded-1 col-sm-4 icon-selector" data-src="/images/mapicons/${response.imageName}">
              <img class="lazy" alt="${response.imageName}" data-src="/images/mapicons/${response.imageName}" width="100px">
            </div>`);
          $(".icon-selector")
            .off("click")
            .click(function () {
              $(".icon-selector").removeClass("active");
              $(this).addClass("active");
              if (!$(this).data("src")) {
                $("#image-upload").click();
                return;
              }
              iconMarker.setMap(map);
              iconMarker.position = polyCoords[0];
              beachFlagImg.width = 50;
              beachFlagImg.src = $(this).data("src");
              payloadData.image = $(this).data("src");
            });
          notyf.success(`Image uploaded successfully: ${response.imageName}`);
        } else {
          notyf.error("Failed to upload image. Please try again.");
        }
      },
      error: function (xhr, status, error) {
        const errorMessage =
          xhr.responseJSON?.message || "An error occurred during upload.";
        notyf.error(errorMessage);
      },
    });
  });
  $(".user-container table tr button.delete").click(function () {
    const tarId = $(this).data("id");
    if (!tarId) return;
    const cnf = confirm("Are you Sure?");
    if (cnf) {
      $.post(`/admin/delete/${tarId}`, (data) => {
        $(`tr[data-id=${tarId}]`).fadeOut(function () {
          $(this).remove();
        });
        notyf.success(data.message);
      });
    }
  });
  $(".vj_dynamic").hide();
  $(".vj_dynamic.home").fadeIn();
  $(".sidebar-container .sidebar .menu ul li").click(function () {
    const linkId = $(this).data("link");
    if (!linkId) return;
    if (linkId == "routes") {
      if (!mapId) return notyf.error("Choose a Valid Map!");
      renderRoutes();
    }
    $(".vj_dynamic").hide();
    $(`.vj_dynamic.${linkId}`).fadeIn();
    $(".sidebar-container .sidebar .menu ul li").removeClass("active");
    $(this).addClass("active");
  });
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        pos.lat = position.coords.latitude;
        pos.lng = position.coords.longitude;
        if (map) map.panTo(pos);
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
  } else {
    notyf.error("Geolocation is not supported by this browser.");
  }
});
let bulkPolyLine, bulkCircle, bulkMarker;
function renderMapMissions() {
  $(".missionEditContainer").empty();
  const tarMission = maps.maps.find((d) => d.id === mapId).missions;
  if (!tarMission) return false;
  if (tarMission.length == 0) {
    $(".missionEditContainer").html(
      `<div class='alert alert-danger'>No Mission exists!</div>`
    );
    return false;
  }
  tarMission.forEach((e) => {
    $(".missionEditContainer").append(
      `<div class='unitMission' data-id='${e._id}'><h5>${e.name} (${e.images.length})</h5><span data-id='${e._id}'>Delete</span></div>`
    );
  });

  $(".unitMission span")
    .off("click")
    .on("click", function () {
      const tarid = $(this).data("id");
      if (!tarid) return;
      if ($(`.unitMission[data-id='${tarid}']`).length == 0) return false;
      const tarMission = maps.maps.find((d) => d.id === mapId).missions;
      $.post(
        "/admin/map/missions/remove",
        {
          missionId: tarid,
          mapId: mapId,
        },
        (data) => {
          if (data.status == "success") {
            notyf.success(data.message);
            $(`.unitMission[data-id='${tarid}']`).remove();
            maps.maps.find((d) => d.id === mapId).missions = tarMission.filter(
              (d) => d._id !== tarid
            );

            if (maps.maps.find((d) => d.id === mapId).missions.length == 0) {
              $(".missionEditContainer").html(
                `<div class='alert alert-danger'>No Mission exists!</div>`
              );
              return false;
            }
          }
        }
      );
    });
}
function renderRoutes() {
  map = new google.maps.Map(document.getElementsByClassName("g-map")[0], {
    zoom: 15,
    center: pos,
    mapId: "Main_Map",
  });
  marker = new google.maps.marker.AdvancedMarkerElement({
    position: pos,
  });
  marker.setMap(null);
  polygon = new google.maps.Polyline({
    map: map,
  });
  circle = new google.maps.Circle({
    center: pos,
    radius: 5000,
  });

  iconMarker = new google.maps.marker.AdvancedMarkerElement({
    position: pos,
    content: beachFlagImg,
  });
  polygon.setMap(null);
  google.maps.event.addListener(map, "click", (event) => {
    if (isClosedPath) {
      isClosedPath = 0;
      polyCoords = [];
      polygon.setMap(null);
      circle.setMap(null);
      iconMarker.setMap(null);
      $(".btn.undo").fadeIn();
    }
    const clickedLocation = event.latLng;
    const lng = clickedLocation.lng();
    const lat = clickedLocation.lat();
    const tmp = {
      lat: lat,
      lng: lng,
    };
    polyCoords.push(tmp);
    marker.position = tmp;
    marker.setMap(map);
    $(".map-controller").hide();
    if (polyCoords.length > 1) {
      $(".map-controller").show();
      polygon.setPath(polyCoords);
      polygon.setMap(map);
    }
  });

  if (bulkPolyLine) bulkPolyLine.setMap(null);
  if (bulkCircle) bulkCircle.setMap(null);
  if (bulkMarker) {
    bulkMarker.setMap(null);
    bulkMarker.remo;
  }
  $.get(`/api/looproute/${mapId}`, (data) => {
    data.forEach((path) => {
      bulkPolyLine = new google.maps.Polyline({
        map: map,
        path: path.polygonCoords,
      });
      const cco = path.polygonCoords[0];
      bulkCircle = new google.maps.Circle({
        map: map,
        radius: path.radius,
        center: cco,
      });
      tmpImg = document.createElement("img");
      tmpImg.src = path.image;
      tmpImg.width = 10 * path.size;
      bulkMarker = new google.maps.marker.AdvancedMarkerElement({
        position: cco,
        map: map,
        content: tmpImg,
      });
      bulkMarker.addListener("click", function () {
        const cnf = confirm("Do you want to delete this Route?");
        if (!cnf) return;
        $.post("/admin/looproute/delete", { routeId: path._id }, (data) => {
          if (!data) return;
          notyf.success(data.message);
          renderRoutes();
        });
      });
    });
  });
}
function fetchMaps() {
  $.get("/admin/map", (data) => {
    maps = data;
    $("tbody.map_list").empty();
    const myData = data.maps.reverse();
    myData.forEach((d) => {
      $("tbody.map_list").append(
        `<tr><td>${d.name}</td><td><a target='_blank' href='/map/${d.id}'>View Map</a></td><td><button class='btn btn-info me-1 edit_map' data-id='${d.id}'>Edit</button><button class='me-1 btn btn-danger delete_map' data-id='${d.id}'>delete</button><button class='btn btn-warning setupMissions' data-id='${d.id}'>Missions</button><button class='btn btn-info ms-2 setUpDuplicate' data-id='${d.id}'>Duplicate</button></td></tr>`
      );
    });
    $(".delete_map")
      .off("click")
      .on("click", function () {
        const mapId = $(this).data("id");
        if (!mapId) return;
        if (!confirm("Are You sure?")) return;
        $.post("/admin/map/delete", { mapId: mapId }, (data) => {
          if (data.status == "success") {
            notyf.success(data.message);
            fetchMaps();
          }
        });
      });

    $(".edit_map")
      .off("click")
      .on("click", function () {
        mapId = $(this).data("id");
        if (!mapId) return;
        payloadData.mapId = mapId;
        $(
          ".sidebar-container .sidebar .menu ul li[data-link='routes']"
        ).click();
      });

    $(".setupMissions")
      .off("click")
      .on("click", function () {
        $("#selectedImagesCount").text("0");
        mapId = $(this).data("id");
        if (!mapId) return notyf.error("Invalid Map");
        $(".missionsHandler").fadeIn();
        $(".new_map_form").hide();
        renderMapMissions();
      });

    $(".setUpDuplicate")
      .off("click")
      .on("click", function () {
        const name = prompt("New Map Name?");
        if (!name || !name.trim()) return false;
        const mapId = $(this).data("id");
        if (!mapId) return notyf.error("Invalid MAP ID!");
        $.post("/admin/map/duplicate", { name: name, id: mapId }, (data) => {
          notyf.success("Map duplicated successfully!");
          fetchMaps();
        }).fail(function (xhr, status, error) {
          notyf.error("An error occurred: " + error);
        });
      });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const images = document.querySelectorAll(".lazy");

  let loadDelay = 0;
  function loadImageWithDelay(image) {
    setTimeout(() => {
      image.src = image.dataset.src;
      image.classList.remove("lazy");
    }, loadDelay);
    loadDelay += 200;
  }

  const observer = new IntersectionObserver(
    (entries, observer) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          loadImageWithDelay(entry.target);
          observer.unobserve(entry.target);
        }
      });
    },
    { rootMargin: "100px" }
  );
  images.forEach((image) => {
    observer.observe(image);
  });
});
