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
let customButtons = [];
let loopRouteOptions = {
  url: "/admin/looproute",
  smessage: "New Route added successfully!",
  mode: "new",
};
let primaryMap = [];
let badgeDirs = [];
let badgeDirName = "";
let badgeDirFileName = "";
let badgeFiles = [];
let usingBadgeReward = 0;
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
  if (speed < 0) {
    event.value = 0;
  } else if (speed > 100) {
    event.value = 100;
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
  payloadData.size = size;
};
const setMapRadius = (event) => {
  circle.setCenter(polyCoords[0]);
  radius = Math.pow(event.value / 10, 1.5) * 100;
  $("#radiusNum").val(event.value);
  circle.setRadius(radius);
  circle.setMap(map);
  payloadData.radius = parseInt(event.value);
  console.log(payloadData);
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
  payloadData.radius = parseInt(event.value);
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
  pos = {
    lat: map.getCenter().lat(),
    lng: map.getCenter().lng(),
  };
  if (
    (payloadData.polygonCoords.length > 2 ||
      loopRouteOptions.mode == "update") &&
    payloadData.radius > 0 &&
    payloadData.image &&
    payloadData.speed &&
    payloadData.title &&
    payloadData.description
  ) {
    payloadData.polygonCoords = polyCoords;
    payloadData.radius = radius;
    $.post(loopRouteOptions.url, payloadData, (success, data) => {
      if (success) {
        isClosedPath = 0;
        notyf.success(loopRouteOptions.smessage);
        renderRoutes();
        if (loopRouteOptions.mode == "update") return;
        $("#savePolyModal").modal("hide");
        marker.setMap(null);
        iconMarker.setMap(null);
        polygon.setMap(null);
        circle.setMap(null);
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
  loopRouteOptions.mode = "new";
  loopRouteOptions.url = "/admin/looproute";
  loopRouteOptions.smessage = "New Route added successfully!";
  $(".delRouteBtn").hide();
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
  payloadData.polygonCoords = polyCoords;
});
function saveMission() {
  if (!mapId) return notyf.error("Invalid MapId");
  const missionName = $("#missionname").val();
  const missionUrl = $("#missionurl").val();
  if (
    !missionName ||
    missions.images.length == 0 ||
    (!usingBadgeReward && !missionUrl)
  )
    return notyf.error("Name or URL can't be Empty");

  missions.redeemLink = missionUrl;
  missions.name = missionName;
  missions.type = "url";
  if (usingBadgeReward) {
    missions.mtype = "badge";
    missions.redeemLink = `/badges/${badgeDirName}/${badgeDirFileName}`;
  }
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
const updateCustomBtnList = () => {
  $(".customButtonList").empty();
  customButtons.forEach((d) => {
    $(".customButtonList").append(`<tr data-id='${d._id}'>
        <td>${d.name}</td>
        <td>${d.text}</td>
        <td>${d.link}</td>
        <td>
          <button class='btn btn-info edit' data-id='${d._id}'><span class='fa fa-pencil'></span></button>
          <button class='btn btn-danger delete' data-id='${d._id}'><span class='fa fa-trash'></span></button>
        </td>
      </tr>`);
  });

  $(".customButtonList .edit")
    .off("click")
    .on("click", function () {
      const tarObj = customButtons.find((d) => d._id === $(this).data("id"));
      if (!tarObj) return notyf.error("No Button Found!");
      $("#custombuttoncreator_name").val(tarObj.name);
      $("#custombuttoncreator_text").val(tarObj.text);
      $("#custombuttoncreator_url").val(tarObj.link);
    });

  $(".customButtonList .delete")
    .off("click")
    .on("click", function () {
      const tarObj = customButtons.find((d) => d._id === $(this).data("id"));
      if (!tarObj) return notyf.error("No Button Found!");
      const cnfrm = confirm(`Are you sure to delete "${tarObj.name}"?`);
      if (!cnfrm) return;
      $.post("/admin/button/delete", { name: tarObj.name }, (data) => {
        if (data.status == "success") {
          notyf.success(data.message);
          customButtons = customButtons.filter((d) => d._id != tarObj._id);
          updateCustomBtnList();
        }
      });
    });
};
const renderBadgeFiles = () => {
  $(".fileManagerBody .files").show();
  $(".fileManagerBody .dirs").hide();
  $(".fileManagerBody .files .file-container").empty();
  badgeFiles.forEach((d) => {
    $(".fileManagerBody .files .file-container").append(`
      <div class="col-6 col-sm-4 col-md-3 col-xl-2">
        <div class="fileUnit" data-id="${d}">
          <img src="/badges/${badgeDirName}/${d}" width="100%">
        </div>
      </div>
    `);
  });
  $(".fileManagerBody .files .file-container .fileUnit")
    .off("click")
    .on("click", function () {
      $(".file-description input").val("");
      $(".fileManagerBody .files .file-container .fileUnit").removeClass(
        "selected"
      );
      $(this).addClass("selected");
      $(".fileManagerBody .files .file-container .fileUnit.selected")
        .off("click")
        .on("click", function () {
          const cnf = confirm(
            "Badge will be deleted permanently! Are you sure?"
          );
          if (!cnf) return;
          $.post(
            "/admin/badges/file/delete",
            { dirName: badgeDirName, filename: badgeDirFileName },
            (d) => {
              if (d.status == "success") {
                $(this).remove();
                $(
                  ".fileManagerBody .files .file-container .fileUnit"
                ).removeClass("selected");
                return notyf.success(d.message);
              }
              return notyf.error(d.message);
            }
          );
        });
      $(".file-description").fadeIn();
      notyf.success("File Selected");
      badgeDirFileName = $(this).data("id");
      $.get(
        "/admin/badges/description",
        { dir: badgeDirName, file: badgeDirFileName },
        (d) => {
          $(".file-description input").val(d.description);
        }
      );
    });
};
const renderBadgeDirs = () => {
  $(".fileManagerBody .dirs").show();
  $(".fileManagerBody .files").hide();
  $(".dir-container .row").empty();
  badgeDirs.forEach((d) => {
    $(".dir-container .row").append(`
      <div class="col-6 col-sm-4 col-md-3 col-xl-2">
        <div class="folderUnit" data-id="${d}">
          <span class="fa fa-folder fa-3x"></span>
          <p class="dirname">${d}</p>
        </div>
      </div>
    `);
  });
  $(".dir-container .folderUnit")
    .off("click")
    .on("click", function () {
      $(".fileManagerBody .loader").show();
      badgeDirName = $(this).data("id");
      if (!badgeDirName) return;
      $.post("/admin/badges/file/get", { dirName: badgeDirName }, (data) => {
        $(".fileManagerBody .loader").hide();
        if (data.status != "success" || !data.files)
          return notyf.error(`No File found in ${badgeDirName}`);
        badgeFiles = data.files;
        renderBadgeFiles();
      });
    });
};

const settings = {
  mapMarkerSize: 5,
};
const updateSettings = () => {
  $("#userMapMarkerSize").val(settings.mapMarkerSize);

  for (const key in settings) {
    if (settings.hasOwnProperty(key)) {
      const value = settings[key];
      const inputElement = document.getElementById(key);
      if (inputElement) {
        inputElement.value = value;
      }
    }
  }
};

const updateClientInterface = (targetName) => {
  let text = $(`#${targetName}`).val();
  if (!text) return notyf.error("Can't be Empty!");
  $.post(
    "/admin/settings/update",
    { name: targetName, value: text },
    (data) => {
      if (data && data.status == "success") {
        notyf.success(data.message);
      } else {
        notyf.error(data.message);
      }
    }
  );
};

$(document).ready(() => {
  $(".map-countdown-update").submit(function () {
    const data = $(this).serializeArray();
    $(".map-countdown-update input[name='id'").val(mapId);
    const date = data[0].value;
    const time = data[1].value;
    if (!date || !time) {
      notyf.error("Invalid Date Time");
      return false;
    }
    $.post("/admin/map/update/launch", data, (data) => {
      if (data.status == "success") {
        return notyf.success(data.message);
      }
    });

    return false;
  });
  $(".updateBtntrigger").click(function () {
    const tarId = $(this).data("id");
    if (!tarId) return notyf.error("Invalid Option!");
    updateClientInterface(tarId);
  });
  $(".userMapMarkerSizeBtn").click(() => {
    let sizeVal = parseInt($("#userMapMarkerSize").val());
    if (sizeVal > 10) sizeVal = 10;
    if (sizeVal < 1) sizeVal = 1;
    $("#userMapMarkerSize").val(sizeVal);
    if (!sizeVal) return notyf.error("Hi");
    $.post(
      "/admin/settings/update",
      { name: "mapMarkerSize", value: sizeVal },
      (data) => {
        if (data && data.status == "success") {
          notyf.success(data.message);
        } else {
          notyf.error(data.message);
        }
      }
    );
  });
  $.get("/api/settings/import", (data) => {
    if (data && Array.isArray(data) && data.length > 0) {
      data.forEach((d) => {
        settings[d.name] = d.content;
      });
      updateSettings();
    }
  });
  $(".saveFileDescription").click(() => {
    if (badgeDirFileName && badgeDirName) {
      const badgeDescription = $("#file-description").val();
      $.post(
        "/admin/badges/description",
        {
          dir: badgeDirName,
          file: badgeDirFileName,
          description: badgeDescription,
        },
        (data) => {
          notyf.success("Description Updated!");
        }
      );
    }
  });
  $("#badgeUrlToggle").on("change", (event) => {
    if (event.target.checked) {
      if (!badgeDirFileName || !badgeDirName) {
        event.target.checked = false;
        usingBadgeReward = 0;
        notyf.error("Please Choose a Badge from Settings");
      } else {
        usingBadgeReward = 1;
        $("#missionurl").hide();
        $(".badgePreview").show();
        $(".badgePreview img").attr(
          "src",
          `/badges/${badgeDirName}/${badgeDirFileName}`
        );
      }
    } else {
      usingBadgeReward = 0;
      $(".badgePreview").hide();
      $("#missionurl").show();
    }
  });

  $(".fileManagerBody .files .controllers .btn-danger").click(() => {
    $(".fileManagerBody .loader").show();
    if (!badgeDirName) return;
    const cnfrm = confirm(`Are you sure to delete "${badgeDirName}"`);
    if (!cnfrm) return;
    $.post("/admin/badges/delete", { name: badgeDirName }, (data) => {
      $(".fileManagerBody .loader").hide();
      if (!data || data.status !== "success")
        return notyf.error("Can't Delete");
      badgeDirs = badgeDirs.filter((d) => d !== badgeDirName);
      badgeDirName = "";
      renderBadgeDirs();
    });
  });
  $(".fileManagerBody .files .controllers .btn-info").click(() => {
    $(".fileManagerBody .dirs").fadeIn();
    $(".fileManagerBody .files").hide();
  });
  $(".fileManagerBody .files .controllers .btn-success").click(() => {
    if (!badgeDirName)
      return notyf.error("No folder is given to Upload the file!");

    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";

    input.onchange = (event) => {
      const file = event.target.files[0];
      if (!file) {
        alert("No file selected!");
        return;
      }

      const formData = new FormData();
      formData.append("file", file);
      formData.append("dirName", badgeDirName);

      // Using jQuery AJAX to upload the file
      $.ajax({
        url: `/admin/badges/file/new/${badgeDirName}`,
        type: "POST",
        data: formData,
        contentType: false, // Prevent jQuery from setting content-type header
        processData: false, // Prevent jQuery from processing data
        success: (response) => {
          if (response.status == "success") {
            notyf.success("File uploaded successfully!");
            badgeFiles.push(response.fileName);
            renderBadgeFiles();
          } else {
            notyf.error("Error uploading file: " + response.message);
          }
        },
        error: (xhr, status, error) => {
          alert("An error occurred while uploading the file: " + error);
        },
      });
    };

    input.click();
  });

  $(".fileManagerBody form.new-dir").submit(function () {
    $(".fileManagerBody .loader").show();
    $(".fileManagerBody .dirs").hide();
    const dirName = $(".fileManagerBody form.new-dir #dirName").val();
    if (dirName) {
      $.post("/admin/badges/create", { name: dirName }, (data) => {
        $(".fileManagerBody .loader").hide();
        $(".fileManagerBody .dirs").show();
        if (data.status == "success") {
          notyf.success(`${dirName} created successfully!`);
          badgeDirs.push(dirName.toUpperCase());
          renderBadgeDirs();
          $(".fileManagerBody form.new-dir #dirName").val("");
        }
      });
    } else {
      notyf.error("Enter Valid Name");
    }
    return false;
  });
  $(".fileManagerBody .loader").show();
  $.get("/admin/badges/fetch", (data) => {
    $(".fileManagerBody .loader").hide();
    $(".fileManagerBody .dirs").show();
    if (
      !data ||
      data.status != "success" ||
      !data.directories ||
      data.directories.length == 0
    )
      return;
    badgeDirs = data.directories;
    renderBadgeDirs();
  });
  $("#custombuttoncreator_name").on("input", (event) => {
    let cstbtntext = event.target.value.toLowerCase();
    cstbtntext = cstbtntext.replace(" ", "_");
    $(event.target).val(cstbtntext);
  });
  $(".customButtonCreator").submit((event) => {
    // Prevent the form from submitting
    event.preventDefault();

    // Gather input values
    const customBtndata = {};
    customBtndata.name = $("#custombuttoncreator_name").val();
    customBtndata.text = $("#custombuttoncreator_text").val();
    customBtndata.link = $("#custombuttoncreator_url").val();

    // Validate that all fields are filled
    if (!customBtndata.name || !customBtndata.text || !customBtndata.link) {
      notyf.error("All Fields are required!");
      return false;
    }

    const findExist = customButtons.find((d) => d.name === customBtndata.name);
    let updated = 0;
    if (
      findExist &&
      findExist.text == customBtndata.text &&
      findExist.link == customBtndata.link
    ) {
      return notyf.success("Already Exists!");
    }
    if (findExist) {
      findExist.text = customBtndata.text;
      findExist.link = customBtndata.link;
      updated = 1;
      updateCustomBtnList();
    }
    $.post("/admin/button/new", customBtndata, (data) => {
      if (data.status === "success") {
        notyf.success(data.message);
        if (!updated) {
          customButtons.push(customBtndata);
          updateCustomBtnList();
        }
      }
    });
    $("#custombuttoncreator_name").val("");
    $("#custombuttoncreator_text").val("");
    $("#custombuttoncreator_url").val("");
    return false;
  });

  $.get("/api/buttons", (data) => {
    if (!data) return notyf.error("Buttons Not Found!");
    customButtons = data;
    updateCustomBtnList();
  });
  $(".deleteNewMapMarker").click(() => {
    if (!confirm("Are you sure?")) return;
    $.post("/admin/map/marker/delete", (data) => {
      notyf.success(data.message);
      $("img.markerPreview").attr("src", "/images/map_marker.png");
    });
  });
  $(".uploadNewMapMarker").click(() => {
    var inputFile = $(
      '<input type="file" accept="image/*" style="display: none;">'
    );
    $("body").append(inputFile);

    inputFile.click();
    inputFile.on("change", function (event) {
      var file = event.target.files[0];

      if (!file) {
        console.log("No file selected");
        return;
      }

      var formData = new FormData();
      formData.append("image", file);
      $.ajax({
        url: "/admin/map/marker",
        type: "POST",
        data: formData,
        contentType: false,
        processData: false,
        success: function (response) {
          notyf.success("Marker Changed");
          $("img.markerPreview").attr("src", "/images/" + response.filename);
        },
        error: function (jqXHR, textStatus, errorThrown) {
          console.error("Error uploading file: ", errorThrown);
        },
        complete: function () {
          inputFile.remove();
        },
      });
    });
  });
  fetchMaps();
  renderProvince();
  fetchPrimaryMap();
  $(".primaryMapSelector").on("change", function () {
    if (!primaryMap.map) return $(".primaryUpdateBtn").show();
    const tarId = $(this).val();
    if (primaryMap.map) $(".primaryUpdateBtn").hide();
    if (primaryMap.map && tarId == primaryMap.map._id) return false;
    $(".primaryUpdateBtn").show();
  });
  $(".primaryUpdateBtn").on("click", () => {
    const tarId = $(".primaryMapSelector").val();
    if (primaryMap.map && tarId == primaryMap.map._id)
      return notyf.error("Map Already Selected");
    $.post("/admin/map/primary", { mapId: tarId }, async (data) => {
      if (data.success) {
        await fetchPrimaryMap();
        if (primaryMap.map) $(".primaryUpdateBtn").hide();
        return notyf.success(`Map "${primaryMap.map.name}" set to Primary`);
      }
    });
  });
  $(".datatable.user").DataTable({
    paging: false,
    searching: true,
    ordering: true,
    info: false,
  });
  $("form.provinceMaker").submit(() => {
    const pname = $("#provinceName").val();
    if (!pname) return false;
    $.post("/admin/province", { name: pname }, (data) => {
      notyf.success(`Provinvce "${data.name}" Created successfully!`);
      renderProvince();
      return $("#provinceName").val("");
    });
    return false;
  });
  $("form.new_map_form").submit(function () {
    const mapName = $("form.new_map_form input#name").val();
    const mapLaunchDate = $("form.new_map_form input#mapLaunchDate").val();
    const mapLaunchTime = $("form.new_map_form input#mapLaunchTime").val();

    mapLaunchTime;
    if (!mapName) alert("Please Enter a Valid Name");
    $.post(
      "/admin/map",
      {
        name: mapName,
        mapLaunchDate: mapLaunchDate,
        mapLaunchTime: mapLaunchTime,
      },
      (data) => {
        if (data.status == "success") {
          notyf.success(`Form '${mapName}' created successfully!`);
          fetchMaps();
          $("form.new_map_form input#name").val("");
        }
      }
    );
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
              <img class="lazy" alt="${response.imageName}" src="/images/mapicons/${response.imageName}" width="100px">
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
    } else if (linkId == "setting") {
      $(".managed-image").empty();
      const targetImgs = $(".icon-container img");
      if (targetImgs.length == 0) {
        $(".managed-image").html(
          "<div class='alert alert-warning text-center'>No Image exists!</div>"
        );
      } else {
        for (let index = 0; index < targetImgs.length; index++) {
          const img = targetImgs[index];
          const src = img.getAttribute("data-src");
          $(".managed-image").append(
            `<div class='col-md-3 col-sm-4 col-6'><div class='img-thumbnail' data-src='${src}'><img width='100%' src='${src}' alt='Placeholder images'/></div></div>`
          );
        }
        $(".managed-image .img-thumbnail")
          .off("click")
          .on("click", function () {
            const dataSrc = $(this).data("src");
            if (!dataSrc) return notyf.error("Can't Delete the Image!");
            if (!confirm("Are you Sure?")) return;
            $.post(
              "/admin/looproute/image/delete",
              { dataImg: dataSrc },
              (data) => {
                if (data.status != "success")
                  return notyf.error("Something went wrong!");
                mapId = null;
                notyf.success(data.message);
                $(this).remove();
                notyf.success("Refreshing in 3 seconds!");
                setTimeout(() => {
                  window.location.reload();
                }, 3000);
              }
            );
          });
      }
      if (targetImgs.length > 1) {
        $(".imageCleanerBtn").show();
        $(".imageCleanerBtn")
          .off("click")
          .on("click", () => {
            if (
              !confirm(
                "All Image and All Routes will be deleted! Are you sure?"
              )
            )
              return;

            $.post("/admin/looproute/image/delete/all", (data) => {
              if (data.status && data.status == "success") {
                notyf.success(data.message);
                notyf.success("Refreshing in 3 seconds!");
                setTimeout(() => {
                  window.location.reload();
                }, 3000);
                return false;
              }
            });
          });
      }
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

  $(".importImageBTN").click(function () {
    uploadFileByClick("/admin/import/images");
  });

  $(".importBadgeBTN").click(function () {
    uploadFileByClick("/admin/import/badges");
  });
});

function uploadFileByClick(url) {
  var fileInput = $("<input>", {
    type: "file",
    accept: ".zip",
    style: "display: none;",
  });
  $("body").append(fileInput);
  fileInput.click();
  fileInput.change(function (event) {
    var file = event.target.files[0];
    if (file) {
      var formData = new FormData();
      formData.append("zipFile", file);
      $.ajax({
        url: url,
        type: "POST",
        data: formData,
        contentType: false,
        processData: false,
        success: function () {
          notyf.success("File uploaded successfully!");
        },
        error: function (xhr, status, error) {
          notyf.error("Error: " + error);
        },
        complete: function () {
          fileInput.remove();
        },
      });
    } else {
      alert("Please select a valid ZIP file.");
      console.log(file.type);
      fileInput.remove();
    }
  });
}
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
    loopRouteOptions.mode = "new";
    loopRouteOptions.url = "/admin/looproute";
    loopRouteOptions.smessage = "New Route added successfully!";
    $(".delRouteBtn").hide();
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
    console.log(data);
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
        fillOpacity: path.opacity / 200,
        strokeOpacity: path.opacity / 100,
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
        loopRouteOptions.mode = "update";
        loopRouteOptions.url = "/admin/looproute/update";
        loopRouteOptions.smessage = "Route Updated Successfully!";
        console.log("Changed to YUpdate");
        $(".delRouteBtn").show();
        $("#savePolyModal").modal("show");
        const tarObj = data.find((d) => d._id == path._id);
        if (!tarObj) return notyf.error("Something went Wrong!");

        $("#routeTitle").val(tarObj.title);
        $("#routeDescription").val(tarObj.description);
        $("#sizeRange").val(tarObj.title);
        const modifiedRadius = parseInt(
          10 * Math.pow(tarObj.radius / 100, 2 / 3)
        );
        $("#radiusRange").val(modifiedRadius);
        $("#sizeRange").val(tarObj.size);
        $("#radiusNum").val(modifiedRadius);
        $("#sizeNum").val(tarObj.size);
        $("#imageSpeed").val(tarObj.speed);
        $("#loopOpacity").val(tarObj.opacity);

        payloadData.title = tarObj.title;
        payloadData.loopId = path._id;
        payloadData.description = tarObj.description;
        payloadData.image = tarObj.image;
        payloadData.radius = tarObj.radius;
        payloadData.speed = tarObj.speed;
        payloadData.opacity = tarObj.opacity;
        payloadData.size = tarObj.size;

        $(".delRouteBtn")
          .off("click")
          .on("click", () => {
            if (path && path._id) {
              $.post(
                "/admin/looproute/delete",
                { routeId: path._id },
                (data) => {
                  if (!data) return;
                  notyf.success(data.message);
                  renderRoutes();

                  $("#savePolyModal").modal("hide");
                }
              );
            }
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
    $(".primaryMapSelector").empty();
    myData.forEach((d) => {
      $("tbody.map_list").append(
        `<tr><td>${d.name}</td><td><a target='_blank' href='/map/${d.id}'>View Map</a></td><td><button class='btn btn-info me-1 edit_map' data-id='${d.id}'>Edit</button><button class='me-1 btn btn-danger delete_map' data-id='${d.id}'>delete</button><button class='btn btn-warning setupMissions' data-id='${d.id}'>Missions</button><button class='btn btn-info ms-2 setUpDuplicate' data-id='${d.id}'>Duplicate</button></td></tr>`
      );
      $(".primaryMapSelector").append(
        `<option value='${d._id}'>${d.name}</option>`
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

const fetchPrimaryMap = async () => {
  try {
    const data = await new Promise((resolve, reject) => {
      $.get("/admin/map/primary", (data) => {
        if (data.success) {
          resolve(data);
        } else {
          reject(new Error("Failed to fetch primary map"));
        }
      });
    });

    primaryMap = data.primaryMap;
    if (primaryMap.map) {
      $(".primaryMapSelector").val(primaryMap.map._id);
      $(".primary-map-card p").text(primaryMap.map.name.toUpperCase());
    } else {
      $(".primaryUpdateBtn").show();
    }
  } catch (error) {
    console.error(error);
  }
};

const renderProvince = () => {
  $.get("/auth/countries", (data) => {
    $(".province-table").empty();
    data.countries.forEach((c) => {
      $(".province-table").append(
        `<tr data-id="${c._id}">
          <td>${c.name}</td>
          <td><span data-id='${c._id}'>delete</span></td>  
        </tr>`
      );
    });
    $(".province-table span")
      .off("click")
      .on("click", function () {
        const tarId = $(this).data("id");
        if (!tarId) return;
        $(`.province-table tr[data-id='${tarId}']`).fadeOut(() => {
          $.ajax({
            url: `/admin/province/${tarId}`,
            type: "DELETE",
            success: function (data) {
              notyf.success(data.message);
              $(this).remove();
            },
            error: function (error) {
              console.error("Error:", error);
            },
          });
        });
      });
  });
};
