// start basic

let classesWithColoredParents =
  /checkbox-container__input|radio-container__input|input-container__input|textarea-container__textarea|slider-container__slider/g;

const callFunction = (callback, e) => {
  let element = e.target;
  //if element has any of those classes in regex then its parent will change class.
  if (element.className && element.className.match(classesWithColoredParents))
    callback(element.parentElement);
};

const blur = (element) => element.classList.remove("selected");

const focus = (element) => element.classList.add("selected");

window.addEventListener("focus", (e) => callFunction(focus, e), true);
window.addEventListener("blur", (e) => callFunction(blur, e), true);

const $ = (e) => document.querySelector(e);

let lastToast = null;
function showToast(msg, time = 4000) {
  if (lastToast) clearTimeout(lastToast);
  const toast = $(".toast");
  toast.innerHTML = msg;
  toast.classList.add("toast--on");
  lastToast = setTimeout(function () {
    toast.classList.remove("toast--on");
    lastToast = null;
  }, time);
}

// end basic

// start pageMgr
const pageMgr = {
  current: null,
  history: [],
  load(page, replace = false, recover = false) {
    if (page.title)
      ($("#header").style.display = "block"),
        ($("#content").style.height = "calc(100% - 5.8rem - 6px)"),
        ($("#header").innerHTML = page.title);
    else
      ($("#header").style.display = "none"),
        ($("#content").style.height = "calc(100% - 3rem)"),
        ($("#header").innerHTML = page.title);
    $("#content").innerHTML = page.content;
    if (page.dpad) {
      dpadHandler = Object.assign(
        {
          up() {
            nav(-1);
          },
          down() {
            nav(1);
          },
          left() {
            nav(-1);
          },
          right() {
            nav(1);
          },
        },
        page.dpad
      );
    }
    if (page.extraKey) {
      extraHandler = page.extraKey;
    } else {
      extraHandler = {};
    }
    if (page.canBack) {
      updateSoftKey({
        right: {
          label: "Back",
          callback: function () {
            pageMgr.goBack();
          },
        },
      });
    }
    if (!replace) this.history.unshift(page);
    else this.history[0] = page;
    this.current = page;
    window.scrollTo(0, 0);
    page.onLoad(recover);
  },
  goBack() {
    if (this.current === playingPage) {
        $("#content").classList.remove("playing");
        $(".softkeys").classList.remove("playing");
    }
    if (this.history.length >= 1) {
      this.history.splice(0, 1);
      const l = this.history[0];
      this.load(l, true, true);
    }
  },
};
// end pageMgr

// start keyhandle

const softkeyCallback = {
  left: function () {},
  center: function () {},
  right: function () {},
};
function nav(move) {
  const currentIndex = document.activeElement.tabIndex;
  const next = currentIndex + move;
  const items = document.querySelectorAll(".focusable");
  try {
    items.forEach((e) => {
      if (e.tabIndex == next) {
        e.focus();
        pageMgr.current.onSelected(e, next);
        throw new Error("qwq");
      }
    });
  } catch (e) {
    return;
  }
  if (move == 1) {
    window.scrollTo(0, document.documentElement.scrollHeight);
  } else {
    window.scrollTo(0, 0);
  }
}
let dpadHandler = {
  up() {
    nav(-1);
  },
  down() {
    nav(1);
  },
  left() {
    nav(-1);
  },
  right() {
    nav(1);
  },
};
let extraHandler = {};
function handleKeyDown(evt) {
  switch (evt.key) {
    case "SoftLeft":
    case "[":
      softkeyCallback.left();
      break;

    case "SoftRight":
    case "]":
      softkeyCallback.right();
      break;

    case "Enter":
      softkeyCallback.center();
      break;

    case "HeadsetHook":
      if (music && !music.paused) {
        playingPage.pauseMusic();
      } else {
        playingPage.playMusic();
      }
      break;

    case "ArrowUp":
      dpadHandler.up();
      break;
    case "ArrowDown":
      dpadHandler.down();
      break;
    case "ArrowRight":
      dpadHandler.right();
      break;
    case "ArrowLeft":
      dpadHandler.left();
      break;
    default:
      if (evt.key && extraHandler[evt.key]) {
        extraHandler[evt.key]();
      }
      break;
  }
}

document.addEventListener("keydown", handleKeyDown);

function updateSoftKey(props) {
  const keys = Object.keys(props);

  keys.forEach(function (key) {
    const button = $(".softkey-" + key);
    button.innerHTML = props[key].label;
    softkeyCallback[key] = props[key].callback;
  });
}

// end keyhandle

const pageIndex = {
  title: "Music v1 By cgluWxh",
  content: `
    <div class="cglbox">
        <div class="separator">
            Mode Select
        </div>
        <div class="button-container">
            <button tabindex="1" platform="netease" class="button-container__button focusable">
                Playlists
            </button>
            <button tabindex="2" platform="all" class="button-container__button focusable">
                Search
            </button>
        </div>
    </div>
    `,
  canBack: false,
  dpad: {
    up() {
      nav(-1);
    },
    down() {
      nav(1);
    },
    left() {},
    right() {},
  },
  extraKey: {
    5: () => {
      new MozActivity({
        name: "configure",
        data: {
          target: "device",
          section: "bluetooth",
        },
      });
    },
    3: () => {
      if (!confirm("Are you sure to log out? (3 times remain)")) return;
      if (!confirm("Are you sure to log out? (2 times remain)")) return;
      if (!confirm("Are you sure to log out? (1 time remains)")) return;
      localStorage.removeItem("cookie");
      showToast("Logged out.");
    },
    "#": () => {
      pageMgr.load(playingPage, false, true);
    },
    0: () => {
      if (!confirm("Are you sure to delete all cover caches? (3 times remain)"))
        return;
      if (!confirm("Are you sure to delete all cover caches? (2 times remain)"))
        return;
      if (!confirm("Are you sure to delete all cover caches? (1 time remains)"))
        return;
      caches.delete("ncm-covers");
    },
    "*": () => {
      if (!confirm("Enter backup and restore function?")) return;
      if (confirm("Press ok to backup, press cancel to restore.")) {
        const aFileParts = [JSON.stringify(localStorage)];
        const oMyBlob = new Blob(aFileParts, { type: "text/plain" });
        const r = sdcardStorage.delete("ncm-backup.txt");
        r.onsuccess = r.onerror = () => {
          const req = sdcardStorage.addNamed(oMyBlob, "ncm-backup.txt");
          req.onsuccess = () => {
            showToast("ncm_backup.txt written.");
            return;
          };
          req.onerror = () => {
            showToast("Errors occurred.");
            return;
          };
        };
      } else {
        const req = sdcardStorage.get("ncm-backup.txt");
        req.onsuccess = () => {
          const reader = new FileReader();
          reader.onload = () => {
            const e = JSON.parse(reader.result);
            for (i in e) {
              localStorage.setItem(i, e[i]);
            }
            showToast("Restore success.");
          };
          reader.readAsText(req.result);
          return;
        };
        req.onerror = () => {
          showToast("Errors occurred.");
          return;
        };
      }
    },
  },
  showHistory(key = null) {
    if (!key) {
      key = confirm(
        "Press ok to open history, press cancel to open downloaded music."
      )
        ? "playHistory"
        : "downloaded";
    }
    if (localStorage[key]) {
      const hist = JSON.parse(localStorage[key]);
      const histWithData = [];
      const knownSongs = playingPage.knownSongs;
      for (d of hist) {
        if (d in knownSongs) histWithData.push(knownSongs[d]);
      }
      localStorage.setItem(
        "musiclist",
        JSON.stringify({ data: histWithData, type: "local" })
      );
      pageMgr.load(musicListPage);
    } else {
      showToast("Not found.");
    }
  },
  onLoad(recover) {
    updateSoftKey({
      left: {
        label: "History",
        callback: this.showHistory,
      },
      center: {
        label: "Select",
        callback: () => {},
      },
      right: {
        label: "",
        callback: () => {},
      },
    });
    $(".focusable").focus();
    this.onSelected($(".focusable"));
  },
  onSelected(e) {
    updateSoftKey({
      center: {
        label: "Go",
        callback: () => {
          if (document.activeElement.getAttribute("platform") === "all") {
            pageMgr.load(pageCombine);
          } else {
            pageMgr.load(pageNetease);
          }
        },
      },
    });
  },
};

const pageNeteaseQRLogin = {
  title: "QRLogin",
  content: `<div style="margin-left: 50%; transform: translate(-50%, 0); margin-top: 10px; max-width: 65vw;max-height: 65vh;aspect-ratio:1;display:flex;justify-content:center;align-items:center;" id="loginQR"></div>
    <div id="info">Loading login qr...</div>
    <style>
        #content {text-align:center;font-size: 1.6rem;}
        #loginQR img {
            width: 100%;
        }
    </style>`,
  canBack: false,
  dpad: {
    up() {
      nav(-1);
    },
    down() {
      nav(1);
    },
    left() {},
    right() {},
  },
  onLoad(recover) {
    updateSoftKey({
      left: {
        label: "",
        callback: () => {},
      },
      center: {
        label: "",
        callback: () => {},
      },
      right: {
        label: "",
        callback: () => {},
      },
    });

    ncmApi.loginQRGet().then((e) => {
      const ku = `https://music.163.com/login?codekey=${e}`;
      const qr = new QRCode($("#loginQR"), ku);
      $("#info").innerHTML = "Please scan QR Code to login.";
      const checkOnce = () => {
        ncmApi.loginQRCheck(e).then((statusRes) => {
          console.log(statusRes);
          if (statusRes.code === 800) {
            alert("QR Expired");
            pageMgr.goBack();
            return;
          }
          if (statusRes.code === 802) {
            $("#info").innerHTML =
              "Please click the button to allow new login.";
          }
          if (statusRes.code === 803) {
            localStorage.setItem("cookie", statusRes.cookie);
            pageMgr.load(pageNetease, true);
            return;
          }
          setTimeout(checkOnce, 3000);
        });
      };
      checkOnce();
    });
  },
};

const pageNetease = {
  title: "",
  content: "",
  canBack: true,
  dpad: {
    up() {
      nav(-1);
    },
    down() {
      nav(1);
    },
    left() {},
    right() {},
  },
  extraKey: {
    "#": () => {
      pageMgr.load(playingPage, false, true);
    },
    2: () => {
      const d = document.querySelectorAll(".focusable");
      d[0].focus();
      pageMgr.current.onSelected(d[0]);
    },
    0: () => {
      const d = document.querySelectorAll(".focusable");
      d[d.length - 1].focus();
      pageMgr.current.onSelected(d[d.length - 1]);
    },
  },
  lastHtml: null,
  lastSelected: 0,
  onLoad(recover) {
    updateSoftKey({
      left: {
        label: "History",
        callback: pageIndex.showHistory,
      },
      center: {
        label: "Select",
        callback: () => {},
      },
    });

    if (recover && this.lastHtml) {
      $("#content").innerHTML = this.lastHtml;
      setTimeout(()=>{
        const tmpx = document.querySelectorAll(".focusable")[this.lastSelected||0];
        tmpx.focus();
        this.onSelected(tmpx);
      }, 200);
      return;
    }

    function loginErr() {
        alert("Login failed. Please scan QR Code to login again.");
        localStorage.removeItem("cookie");
        pageMgr.goBack();
    }

    ncmApi.loginStatus().then((e) => {
        try {
            if (e.data.account.type !== 0) {
                const profile = e.data.profile;
                localStorage.userprofile = JSON.stringify(profile);
                ncmApi.userPlaylist().then((rd) => {
                    try {
                        const playlist = rd.playlist;
                        let pg = `
                                            <div class="cglbox forprofile">
                                                <div class="list-item-icon profile focusable" tabindex="0">
                                                    <img src="${
                                                    profile.avatarUrl || ""
                                                    }" alt="" class="list-item-icon__icon" />
                                                    <div class="list-item-icon__text-container" style="text-align: center;width: 100%;">
                                                        <p class="list-item-icon__text">${
                                                        profile.nickname || ""
                                                        }</p>
                                                    </div>
                                                </div>
                                                <div class="list-item focusable" tabindex="1" list="playHistory" total="${
                                                playingPage.playHistory.length
                                                }">
                                                    <p class="list-item__text">Play History</p>
                                                    <p class="list-item__subtext">${
                                                    playingPage.playHistory.length
                                                    } songs</p>
                                                </div>
                                                <div class="list-item focusable" tabindex="2" list="downloaded" total="${
                                                playingPage.downloaded.length
                                                }">
                                                    <p class="list-item__text">Downloaded Music</p>
                                                    <p class="list-item__subtext">${
                                                    playingPage.downloaded.length
                                                    } songs</p>
                                                </div>
                                            </div>
                                            <div class="cglbox">
                                                <div class="separator">
                                                    My PlayLists
                                                </div>`;

                        localStorage.myFavId = playlist[0].id;

                        for (var i = 0; i < playlist.length; i++) {
                            const row = playlist[i];
                            if (row.creator.userId !== profile.userId) break;
                            pg += `<div class="list-item focusable" tabindex="${i + 3}" list="${
                            row.id
                            }" total="${row.trackCount || ""}">
                                                    <p class="list-item__text">${
                                                    row.name || ""
                                                    }</p>
                                                    <p class="list-item__subtext">${
                                                    row.trackCount || ""
                                                    } songs</p>
                                                </div>`;
                        }

                        pg += `</div><div class="cglbox"><div class="separator">
                                                Subscribed PlayLists
                                            </div>`;

                        for (; i < playlist.length; i++) {
                            const row = playlist[i];
                            pg += `<div class="list-item focusable" tabindex="${i + 3}" list="${
                            row.id
                            }" total="${row.trackCount || ""}">
                                                    <p class="list-item__text">${
                                                    row.name || ""
                                                    }</p>
                                                    <p class="list-item__subtext">${
                                                    row.trackCount || ""
                                                    } songs</p>
                                                </div>`;
                        }

                        pg += "</div>";

                        this.lastHtml = pg;

                        $("#content").innerHTML = pg;

                        setTimeout(()=>{
                            const tmpx = document.querySelectorAll(".focusable")[this.lastSelected||0];
                            tmpx.focus();
                            this.onSelected(tmpx);
                          }, 200);
                    } catch {loginErr();}
                }).catch(loginErr);
            } else {
                pageMgr.load(pageNeteaseQRLogin, true);
                return;
            }
        } catch { loginErr(); }
    }).catch(loginErr)
  },
  viewPlaylist(id, total) {
    if (id === "downloaded") {
      pageIndex.showHistory("downloaded");
      return;
    }
    if (id === "playHistory") {
      pageIndex.showHistory("playHistory");
      return;
    }
    ncmApi.playlistTracks(id).then((e) => {
      e.total = total;
      e.id = id;
      localStorage.musiclist = JSON.stringify(e);
      pageMgr.load(musicListPage);
    });
  },
  logOut() {
    if (!confirm("Are you sure to log out? (3 times remain)")) return;
    if (!confirm("Are you sure to log out? (2 times remain)")) return;
    if (!confirm("Are you sure to log out? (1 time remains)")) return;
    localStorage.removeItem("playing");
    localStorage.removeItem("playList");
    localStorage.removeItem("myFavId");
    localStorage.removeItem("lastSearch");
    localStorage.removeItem("cookie");
    localStorage.removeItem("musiclist");
    localStorage.removeItem("userprofile");
    for (x in localStorage) {
      if (x.startsWith("ncmCache")) localStorage.removeItem(x);
    }
    showToast("Logged out.");
    pageMgr.goBack();
  },
  onSelected(e, idx) {
    this.lastSelected = idx;
    const id = e.getAttribute("list");
    if (!id) {
      updateSoftKey({
        center: {
          label: "Logout",
          callback: pageNetease.logOut,
        },
      });
    } else {
      const total = e.getAttribute("total");
      updateSoftKey({
        center: {
          label: "Enter",
          callback: () => {
            this.viewPlaylist(id, parseInt(total));
          },
        },
      });
    }
  },
};

const pageCombine = {
  title: "Search",
  content: `<div class="input-container">
    <label class="input-container__label">Music Name</label>
    <input type="text" tabindex="0" id="input-name" class="input-container__input focusable" />
    </div>
    <div class="cglbox">
        <div class="separator">
            Music Platforms
        </div>
        <div class="button-container">
            <button tabindex="1" platform="netease" class="button-container__button focusable">
                Netease
            </button>
            <button tabindex="2" platform="qq" class="button-container__button focusable">
                QQ Music
            </button>
            <button tabindex="3" platform="kugou" class="button-container__button focusable">
                Kugou Music
            </button>
            <button tabindex="4" platform="kuwo" class="button-container__button focusable">
                Kuwo Music
            </button>
            <button tabindex="5" platform="netease-pro" class="button-container__button focusable">
                Netease Enhanced
            </button>
        </div>
    </div>`,
  dpad: {
    up() {
      nav(-1);
    },
    down() {
      nav(1);
    },
    left() {},
    right() {},
  },
  extraKey: {
    "#": () => {
      pageMgr.load(playingPage, false, true);
    },
  },
  canBack: true,
  searchSongApi(name, platform, page = 1, filter = "name") {
    const data = {
      input: name,
      filter: filter,
      type: platform,
      page: page,
    };
    if (filter === "name") localStorage.lastSearch = JSON.stringify(data);
    return request("https://music.liuzhijin.cn/", "POST", objToEncoded(data));
  },
  searchSong(platform, page = 1) {
    showToast("Loading...");
    if (platform == "netease-pro") {
      localStorage.lastSearch = JSON.stringify({
        input: $("#input-name").value,
      });
      ncmApi.cloudSearch($("#input-name").value).then((e) => {
        localStorage.setItem(
          "musiclist",
          JSON.stringify({ data: e.result.songs, type: "local" })
        );
        pageMgr.load(musicListPage);
      });
      return;
    }
    this.searchSongApi($("#input-name").value, platform, page).then((e) => {
      e = e.responseText;
      localStorage.setItem("musiclist", e);
      pageMgr.load(musicListPage);
    });
  },
  onLoad(recover) {
    updateSoftKey({
      left: {
        label: "History",
        callback: pageIndex.showHistory,
      },
      center: {
        label: "Select",
        callback: () => {},
      },
    });
    if (recover) {
      if (localStorage.lastSearch) {
        const d = JSON.parse(localStorage.lastSearch);
        $("#input-name").value = d.input;
      }
    }
    $(".focusable").focus();
    this.onSelected($(".focusable"));
  },
  onSelected(e) {
    if (e.tagName === "INPUT" && e.type === "text") {
      updateSoftKey({
        center: {
          label: "",
          callback: () => {},
        },
      });
    } else {
      updateSoftKey({
        center: {
          label: "Search",
          callback: () => {
            this.searchSong(document.activeElement.getAttribute("platform"));
          },
        },
      });
    }
  },
};

const musicListPage = {
  title: "Music List",
  content: "",
  canBack: true,
  dpad: {
    up() {
      nav(-1);
    },
    down() {
      nav(1);
    },
    left() {
      musicListPage.lastSelected = 0;
      if (musicListPage.dataType === "netease") {
        if (musicListPage.page > 1) {
          ncmApi
            .playlistTracks(musicListPage.id, 50, musicListPage.page * 50 - 100)
            .then((e) => {
              e.total = musicListPage.total;
              e.id = musicListPage.id;
              localStorage.musiclist = JSON.stringify(e);
              musicListPage.dataType = "netease";
              musicListPage.data = e.songs;
              musicListPage.page -= 1;
              musicListPage.renderPageFromData(e.songs);
              $("#header").innerHTML = `< Music List ${
                musicListPage.page
              }/${Math.ceil(musicListPage.total / 50)} >`;
            });
        }
      } else if (musicListPage.dataType === "multi") {
        if (musicListPage.page > 1) {
          const last = JSON.parse(localStorage.lastSearch);
          pageCombine
            .searchSongApi(last.input, last.type, musicListPage.page - 1)
            .then((e) => {
              e = JSON.parse(e);
              localStorage.musiclist = JSON.stringify(e);
              musicListPage.dataType = "multi";
              musicListPage.data = e.data;
              musicListPage.page -= 1;
              musicListPage.renderPageFromData(e.data);
              $(
                "#header"
              ).innerHTML = `< Music List Page ${musicListPage.page} >`;
            });
        }
      }
    },
    right() {
      musicListPage.lastSelected = 0;
      if (musicListPage.dataType === "netease") {
        if (musicListPage.page < Math.ceil(musicListPage.total / 50)) {
          ncmApi
            .playlistTracks(musicListPage.id, 50, musicListPage.page * 50)
            .then((e) => {
              e.total = musicListPage.total;
              e.id = musicListPage.id;
              localStorage.musiclist = JSON.stringify(e);
              musicListPage.dataType = "netease";
              musicListPage.data = e.songs;
              musicListPage.page += 1;
              musicListPage.renderPageFromData(e.songs);
              $("#header").innerHTML = `< Music List ${
                musicListPage.page
              }/${Math.ceil(musicListPage.total / 50)} >`;
            });
        }
      } else if (musicListPage.dataType === "multi") {
        const last = JSON.parse(localStorage.lastSearch);
        pageCombine
          .searchSongApi(last.input, last.type, musicListPage.page + 1)
          .then((e) => {
            e = JSON.parse(e);
            localStorage.musiclist = JSON.stringify(e);
            musicListPage.dataType = "multi";
            musicListPage.data = e.data;
            musicListPage.page += 1;
            musicListPage.renderPageFromData(e.data);
            $(
              "#header"
            ).innerHTML = `< Music List Page ${musicListPage.page} >`;
          });
      }
    },
  },
  extraKey: {
    "#": () => {
      pageMgr.load(playingPage, false, true);
    },
    2: () => {
      const d = document.querySelectorAll(".focusable");
      d[0].focus();
      pageMgr.current.onSelected(d[0]);
    },
    0: () => {
      const d = document.querySelectorAll(".focusable");
      d[d.length - 1].focus();
      pageMgr.current.onSelected(d[d.length - 1]);
    },
  },
  data: null,
  dataType: null,
  page: 1,
  total: 0,
  id: 0,
  lastSelected: 0,
  onSelected(_, id) {
    this.lastSelected = id;
  },
  onLoad(recover) {
    updateSoftKey({
      left: {
        label: "",
        callback: function () {
          /* Code */
        },
      },
      center: {
        label: "Select",
        callback: () => {
          musicListPage.playSong(document.activeElement.tabIndex);
        },
      },
    });
    const initData = () => {
      const raw = JSON.parse(localStorage.getItem("musiclist"));
      if (!recover) {
        musicListPage.page = 1;
        musicListPage.lastSelected = 0;
      }
      if (raw.type === "local") {
        musicListPage.dataType = "local";
        musicListPage.data = raw.data;
        $("#header").innerHTML = `Local PlayList`;
      } else if (raw.data) {
        musicListPage.dataType = "multi";
        musicListPage.data = raw.data;
        $("#header").innerHTML = `< Music List Page ${musicListPage.page} >`;
      } else {
        musicListPage.dataType = "netease";
        musicListPage.data = raw.songs;
        musicListPage.total = raw.total;
        musicListPage.id = raw.id;
        $("#header").innerHTML = `< Music List ${
          musicListPage.page
        }/${Math.ceil(musicListPage.total / 50)} >`;
      }
      this.renderPageFromData(this.data);
    };
    initData();
  },
  renderPageFromData(data) {
    let pageContent = ``;
    for (let i = 0; i < data.length; i++) {
      const r = data[i];
      pageContent += `
                <div class="list-item focusable" tabindex="${i}">
                    <p class="list-item__text">${r.title || r.name}</p>
                    <p class="list-item__subtext">${
                      r.author || ncmApi.combineArtists(r.ar)
                    }</p>
                </div>`;
    }

    $("#content").innerHTML = pageContent;
    document.querySelectorAll(".focusable")[this.lastSelected].focus();
  },
  getFullData(id, type, base = null) {
    return new Promise((resolve, reject) => {
      function resolveLocal() {
        if (id in playingPage.knownSongs) {
          resolve(playingPage.knownSongs[id]);
          return;
        } else {
          showToast("Cannot fetch info.");
          reject();
          return;
        }
      }
      if (!onlineCheck()) {
        resolveLocal();
        return;
      }
      if (["multi", "local"].indexOf(type) > -1) {
        const nextaction = (id, type, base) => {
          if (base.type === "netease") {
            ncmApi
              .songLyric(id)
              .then((e) => {
                const newData = base;
                if (e.lrc && e.lrc.lyric) newData.lrc = e.lrc.lyric;
                if (e.tlyric && e.tlyric.lyric) newData.tlyric = e.tlyric.lyric;
                if (e.romalrc && e.romalrc.lyric)
                  newData.romalrc = e.romalrc.lyric;
                resolve(newData);
              })
              .catch(() => resolveLocal());
            return;
          }
          resolve(base);
        };
        if (!base) {
          pageCombine
            .searchSongApi(id, type, 1, "id")
            .then((base) => {
              nextaction(id, type, base);
            })
            .catch(() => resolveLocal());
        } else {
          nextaction(id, type, base);
        }
      } else {
        const nextaction = (id, type, base) => {
          ncmApi
            .songLyric(id)
            .then((e) => {
              const od = base;
              const newData = {
                author: ncmApi.combineArtists(od.ar),
                pic: od.al.picUrl,
                songid: od.id,
                title: od.name,
                type: "netease",
                lrc: "",
              };
              if (e.lrc && e.lrc.lyric) newData.lrc = e.lrc.lyric;
              if (e.tlyric && e.tlyric.lyric) newData.tlyric = e.tlyric.lyric;
              if (e.romalrc && e.romalrc.lyric)
                newData.romalrc = e.romalrc.lyric;
              resolve(newData);
            })
            .catch(() => resolveLocal());
        };
        if (base) {
          nextaction(id, type, base);
        } else {
          ncmApi
            .songDetail(id)
            .then((e) => {
              nextaction(id, type, e.songs[0]);
            })
            .catch(() => resolveLocal());
        }
      }
    });
  },
  playSong(i) {
    const id = this.data[i].id || this.data[i].songid;
    this.getFullData(
      id,
      this.data[i].title ? "multi" : "netease",
      this.data[i]
    ).then((e) => {
      if (
        confirm(
          "Press cancel to add the song to playlist, press yes to replace playlist with current."
        )
      ) {
        if (["multi", "local"].indexOf(this.dataType) > -1) {
          playingPage.data = e;
          playingPage.playList = this.data;
          pageMgr.load(playingPage);
        } else {
          ncmApi.playlistTracks(musicListPage.id, null, 0).then((ex) => {
            const d = [];
            playingPage.data = e;
            playingPage.playList = ex.songs;
            pageMgr.load(playingPage);
          });
        }
      } else {
        const playing = playingPage.data;
        const list = playingPage.playList;
        const idx = list.findIndex(
          (e) => e.songid === playing.songid || e.id === playing.songid
        );
        const idx2 = list.findIndex((e) => e.songid === id || e.id === id);
        if (idx2 == -1) {
          if (idx > -1) {
            const front = list.slice(0, idx + 1);
            const tail = list.slice(idx + 1);
            front.push(e);
            const res = front.concat(tail);
            playingPage.playList = res;
          } else {
            list.push(e);
            playingPage.playList = list;
          }
        }
        playingPage.data = e;
        pageMgr.load(playingPage);
      }
    });
  },
};

var volume = isKai ? navigator.volumeManager : {};
var musicStorage = isKai ? navigator.getDeviceStorage("music") : {};
var sdcardStorage = isKai ? navigator.getDeviceStorage("sdcard") : {};
var music;

const playingPage = {
  inited: false,
  timeStop: null,
  title: "",
  content: `
    <div id="playingAll">
    <div id="songDetail" style="display:block;">
    <img src="" id="songCover" />
</div>
<div id="songLyrics" class="lyricnone" style="display:none;">
</div>
<div id="songName"></div>
<div id="songArtist"></div>
<div id="songProgress">
    <div style="display:inline-block;" id="songProgressPlayed"></div> / <div style="display:inline-block;" id="songProgressTotal"></div>
</div>
    </div>
        <div id="playListPopup" style="display:none;">
        </div>
        <style>

        #content {
            text-align: center;
        }
        
        #songName {
            font-size: 1.7rem;
            overflow: hidden;
            width: 100%;
            height: 2.1rem;
        }
        
        #songArtist {
            font-size: 1.2rem;
            color: #eeeeeecc;
        }
        
        #songProgress {
            font-size: 1.2rem;
        }
        
        #songLyrics {
            height: 70vh;
        }

        #songCover {
            height: 70vh;
        }

        #songCover {
            height: 60vh;
            margin-top: 5vh;
            margin-bottom: 3vh;
            border-radius: 50%;
        }

        .lyricline {
            height: 18%;
            color: #eeeeeecc;
            font-size: 1.3rem;
            display: flex;
            align-items: center;
            justify-content: center;
            overflow: hidden;
        }
        
        .lyricline.lyricnow {
            height: 28%;
            font-size: 1.5rem;
            color: white;
            overflow: visible;
        }

        #songLyrics:not(.lyricnone) > .lyricline:first-child {
            display: none;
        }
        #songLyrics:not(.lyricnone) > .lyricline:last-child {
            display: none;
        }
        #songLyrics:not(.lyricnone) .lyricline {
            height: 30%;
        }
        
        #songLyrics:not(.lyricnone) .lyricline.lyricnow {
            height: 40%;
        }

       
        
        </style>`,
  dpad: {
    up() {
      if (playingPage.panelOpen) {
        nav(-1);
        return;
      }
      volume.requestUp();
    },
    down() {
      if (playingPage.panelOpen) {
        nav(1);
        return;
      }
      volume.requestDown();
    },
    left() {
      if (playingPage.panelOpen) {
        return;
      }
      playingPage.prevSong();
    },
    right() {
      if (playingPage.panelOpen) {
        return;
      }
      playingPage.nextSong(null, true);
    },
  },
  _panelOpen: false,
  get panelOpen() {
    return this._panelOpen;
  },
  set panelOpen(e) {
    this._panelOpen = e;
    if (e) {
      $("#playListPopup").style.display = "block";
      $("#playingAll").style.display = "none";
      this.renderPanel();
    } else {
      $("#playingAll").style.display = "block";
      $("#playListPopup").style.display = "none";
      if (music && !music.paused) {
        this.playMusic();
      } else {
        this.pauseMusic();
      }
    }
  },
  deleteOne() {
    const playing = this.data;
    const list = this.playList;
    if (list.length === 1) {
      showToast("Playlist must have 1 song at least.");
      return;
    }
    const idx2 = list.findIndex(
      (e) => e.songid === playing.songid || e.id === playing.songid
    );
    const idx = this.selectedId;
    if (playingPage.playList[idx]) {
      const d = playingPage.playList;
      if (idx === idx2) {
        let next = idx2 + 1;
        if (next >= d.length) next -= d.length;
        playingPage.data = d[next];
        playingPage.playSong();
      }
      d.splice(idx, 1);
      playingPage.playList = d;
      const n = idx >= d.length ? d.length - 1 : idx;
      this.renderPanel(idx === idx2 ? null : n);
    }
  },
  playOne(idx) {
    if (playingPage.playList[idx]) {
      playingPage.data = playingPage.playList[idx];
      playingPage.playSong();
    }
  },
  selectedId: null,
  onSelected(e, idx) {
    this.selectedId = idx;
    updateSoftKey({
      center: {
        label: "Select",
        callback: () => playingPage.playOne(idx),
      },
    });
  },
  renderPanel(toidx = null) {
    const playing = this.data;
    const list = this.playList;
    let idx = list.findIndex(
      (e) => e.songid === playing.songid || e.id === playing.songid
    );

    let pg = "";
    for (let i = 0; i < list.length; i++) {
      const row = list[i];
      pg += `<div class="list-item focusable" tabindex="${i}">
                <p class="list-item__text">${row.title || row.name}</p>
                <p class="list-item__subtext">${
                  row.author || ncmApi.combineArtists(row.ar)
                }</p>
            </div>`;
    }
    $("#playListPopup").innerHTML = pg;

    if (toidx) idx = toidx;

    const d = document.querySelectorAll(".focusable")[idx];
    d.focus();
    this.onSelected(d, idx);
  },
  timeoutId: null,
  extraKey: {
    1: function () {
      const id = playingPage.data.songid;
      const type = playingPage.data.type;
      const name = playingPage.data.title;
      if (type === "netease") {
        ncmApi.likeList().then((e) => {
          const d = e.ids;
          if (d.indexOf(id) > -1) {
            if (!confirm(`You have added ${name} to your likelist, remove?`))
              return;
            ncmApi.like(id, false).then((e) => {
              if (e.code === 200) showToast("Removed.");
            });
          } else {
            if (!confirm(`Would you like to add ${name} to your likelist?`))
              return;
            ncmApi.like(id, true).then((e) => {
              if (e.code === 200) showToast("Added.");
            });
          }
        });
      }
    },
    3: function () {
      if (playingPage.downloaded.indexOf(playingPage.data.songid) > -1) {
        if (!confirm(`You have downloaded ${playingPage.data.title}, delete?`))
          return;
        let req = musicStorage.delete(`${playingPage.data.songid}.mp3`);
        req.onsuccess = () => {
          const downloaded = playingPage.downloaded;
          downloaded.splice(downloaded.indexOf(playingPage.data.songid), 1);
          playingPage.downloaded = downloaded;
          caches.open("ncm-covers").then((e) => {
            e.delete(`/${playingPage.data.songid}.jpg`);
          });
          showToast(`${playingPage.data.title} deleted.`);
        };
      } else {
        if (!confirm(`Would you like to download ${playingPage.data.title}?`))
          return;
        playingPage.downloadSong();
      }
    },
    4: function () {
      if (playingPage.panelOpen) playingPage.deleteOne();
    },
    5: function () {
      playingPage.switchLyrics();
    },
    6: function () {
      playingPage.panelOpen = !playingPage.panelOpen;
    },
    7: function () {
      const all = ["none", "translate", "romaji"];
      let l = all.indexOf(playingPage.lyricMode);
      l += 1;
      if (l > 2) l = 0;
      playingPage.lyricMode = all[l];
      $("#songLyrics").setAttribute("class", `lyric${all[l]}`);
      showToast(`Show ${all[l]}`);
    },
    8: function () {
      if (playingPage.timeStop) {
        const k = (playingPage.timeStop - new Date().getTime()) / 1000 / 60;
        let msg = "Music is scheduled to be stopped after";
        const mins = Math.floor(k);

        if (mins < 0) {
          msg += " this song";
        } else {
          const seconds = Math.floor((k - mins) * 60);
          if (mins > 0) msg += ` ${mins} minute${mins > 1 ? "s" : ""}`;
          if (seconds > 0) msg += ` ${seconds} second${seconds > 1 ? "s" : ""}`;
        }

        msg += `. Are you sure to cancel?`;
        if (!confirm(msg)) return;
        playingPage.timeStop = null;
        playingPage.timeoutId && clearTimeout(playingPage.timeoutId);
        playingPage.timeoutId = null;
        showToast(`Scheduled stop cancelled.`);
        return;
      }
      let t = prompt("Please input time to stop. (Unit: minute)");
      t = parseInt(t);
      if (t) {
        if (
          !confirm(
            "Would you want the music to be stopped after finishing playing a song?"
          )
        ) {
          playingPage.timeoutId = setTimeout(() => {
            playingPage.pauseMusic();
            playingPage.timeoutId = null;
            playingPage.timeStop = null;
          }, t * 1000 * 60);
        }
        playingPage.timeStop = new Date().getTime() + t * 1000 * 60;
        showToast(`Stop in ${t} minutes.`);
      }
    },
    9: function () {
      playingPage.updateInfo();
    },
    2: () => {
      if (!playingPage.panelOpen) return;
      const d = document.querySelectorAll(".focusable");
      d[0].focus();
      pageMgr.current.onSelected(d[0]);
    },
    0: () => {
      if (!playingPage.panelOpen) return;
      const d = document.querySelectorAll(".focusable");
      d[d.length - 1].focus();
      pageMgr.current.onSelected(d[d.length - 1]);
    },
    "*": function () {
      let d = music.currentTime - 15;
      if (d < 0) d = 0;
      music.fastSeek(d);
    },
    "#": function () {
      let d = music.currentTime + 15;
      if (d > music.duration - 1) d = music.duration - 1;
      music.fastSeek(d);
    },
  },
  lyricData: [],
  lyricMode: "none",
  playMode: "RS",
  get playList() {
    if (localStorage.playList)
      return JSON.parse(localStorage.getItem("playList"));
    else return [];
  },
  set playList(e) {
    localStorage.playList = JSON.stringify(e);
  },
  get data() {
    if (localStorage.playing)
      return JSON.parse(localStorage.getItem("playing"));
    else return {};
  },
  set data(e) {
    localStorage.playing = JSON.stringify(e);
  },
  tick: null,
  currentBlob: {},
  updatePlayMode(next = true) {
    const playModes = ["OD", "RS", "RD"];
    if (next) {
      let d = playModes.indexOf(playingPage.playMode) + 1;
      if (d > 2) d -= 3;
      playingPage.playMode = playModes[d];
    }
    updateSoftKey({
      left: {
        label: playingPage.playMode,
        callback: playingPage.updatePlayMode,
      },
    });
  },
  downloadSong() {
    showToast(`Start download ${this.data.title}...`);
    const id = this.data.songid;
    if (this.currentBlob.id == id && this.currentBlob.blob) {
      musicStorage.addNamed(this.currentBlob.blob, `${id}.mp3`);
      const downloaded = playingPage.downloaded;
      downloaded.unshift(this.data.songid);
      playingPage.downloaded = downloaded;
      request(playingPage.data.pic, "GET", null, null, "blob").then((e) => {
        e = e.response;
        const blob = new Blob([e], { type: "image/jpeg" });
        caches.open("ncm-covers").then((e) => {
          e.put(`/${playingPage.data.pic}.jpg`, new Response(blob));
          showToast(`Download success!`);
        });
        return;
      });
      return;
    }
    this.getPlayURL().then((e) => {
      request(e, "GET", null, null, "blob").then((e) => {
        e = e.response;
        const blob = new Blob([e], { type: "audio/mpeg" });
        musicStorage.addNamed(blob, `${id}.mp3`);
        const downloaded = playingPage.downloaded;
        downloaded.unshift(this.data.songid);
        playingPage.downloaded = downloaded;
        request(playingPage.data.pic, "GET", null, null, "blob").then((e) => {
          e = e.response;
          const blob = new Blob([e], { type: "image/jpeg" });
          caches.open("ncm-covers").then((e) => {
            e.put(`/${playingPage.data.pic}.jpg`, new Response(blob));
            showToast(`Download success!`);
          });
          return;
        });
        return;
      });
    });
  },
  get downloaded() {
    if (localStorage.downloaded) {
      const i = JSON.parse(localStorage.downloaded);
      return i;
    } else {
      localStorage.downloaded = "[]";
      return [];
    }
  },
  set downloaded(e) {
    localStorage.downloaded = JSON.stringify(e);
  },
  getPlayURL() {
    return new Promise((resolve, reject) => {
      if (!isKai) {
        resolve("http://music.163.com/song/media/outer/url?id=22635185.mp3");
        return;
      }
      const id = this.data.songid;
      let request = musicStorage.get(`${id}.mp3`);
      request.onsuccess = () => {
        let file = request.result;
        let objectURL = URL.createObjectURL(file);

        if (this.downloaded.indexOf(id) == -1) {
          const d = this.downloaded;
          d.unshift(id);
          this.downloaded = d;
        }

        resolve(objectURL);
      };
      request.onerror = () => {
        if (!onlineCheck()) {
          reject();
          return;
        }
        if (this.data.type == "netease") {
          ncmApi
            .songDLUrl(id)
            .then((e) => {
              if (e.data.blob) this.currentBlob = { id: id, blob: e.data.blob };
              resolve(e.data.url);
            })
            .catch(() => reject());
        } else {
          pageCombine
            .searchSongApi(this.data.songid, this.data.type, 1, "id")
            .then((e) => {
              e = JSON.parse(e.responseText);
              resolve(e.data[0].url);
            })
            .catch(() => reject());
        }
      };
    });
  },
  pauseMusic() {
    music.pause();
    if (this.panelOpen || pageMgr.current !== playingPage) return;
    updateSoftKey({
      center: {
        label: "Play",
        callback: playingPage.playMusic,
      },
    });
  },
  playMusic() {
    music.play();
    if (this.panelOpen || pageMgr.current !== playingPage) return;
    updateSoftKey({
      center: {
        label: "Pause",
        callback: playingPage.pauseMusic,
      },
    });
  },
  randint(n, m) {
    return Math.floor(Math.random() * (m + 1 - n) + n);
  },
  toPrevSong: false,
  prevSong() {
    const playing = this.data;
    const list = this.playList;
    const idx = list.findIndex(
      (e) => e.songid === playing.songid || e.id === playing.songid
    );
    let next = idx - 1;
    if (next < 0) next += list.length;
    this.toPrevSong = true;
    this.data = list[next];
    this.playSong();
  },
  nextSong(_, force = false, force2 = false) {
    if (playingPage.timeStop && new Date().getTime() > playingPage.timeStop) {
      playingPage.pauseMusic();
      playingPage.timeStop = null;
      return;
    }
    const playing = this.data;
    if (force2) showToast(`Offline, skip ${playing.title || playing.name}`);
    const list = this.playList;
    const playingid = playing.songid || playing.id;
    const idx = list.findIndex(
      (e) => e.songid == playingid || e.id == playingid
    );
    let next;
    let mode = this.playMode;
    if (force2 || (force && mode == "RS")) mode = "OD";
    switch (mode) {
      case "RS":
        const currentsrc = music.src;
        music.src = "null";
        music.src = currentsrc;
        music.fastSeek(0);
        music.play();
        this.updateInfo();
        return;
      case "OD":
        if (!playingPage.toPrevSong) {
          next = idx + 1;
          if (next >= list.length) {
            next -= list.length;
          }
        } else {
          next = idx - 1;
          if (next < 0) next += list.length;
        }
        break;
      case "RD":
        next = this.randint(0, list.length - 1);
        break;
    }
    this.data = list[next];
    this.playSong();
  },
  updateInfo() {
    function secondtoread(e) {
      return `${Math.floor(e / 60) < 10 ? "0" : ""}${Math.floor(e / 60)}:${
        parseInt(Math.floor(e)) % 60 < 10 ? "0" : ""
      }${parseInt(Math.floor(e)) % 60}`;
    }
    $("#songProgressPlayed").innerHTML = "00:00";
    $("#songProgressTotal").innerHTML = "Loading...";
    $("#songName").innerHTML = playingPage.data.title;
    $("#songArtist").innerHTML = playingPage.data.author;
    $("#songProgressTotal").innerHTML = secondtoread(music.duration);
    $("#songLyrics").setAttribute("class", `lyric${playingPage.lyricMode}`);
    playingPage.updatePlayMode(false);
    if (music && !music.paused) {
      playingPage.playMusic();
    } else {
      playingPage.pauseMusic();
    }
    navigator.mozAudioChannelManager &&
      (navigator.mozAudioChannelManager.onheadphoneschange = () => {
        if (music) playingPage.pauseMusic();
      });
    const filename = `/${playingPage.data.songid}.jpg`;
    const currentId = playingPage.data.songid;
    caches.open("ncm-covers").then((cache) => {
      return cache
        .match(filename)
        .then((response) => {
          if (response) return response.blob();
          else {
            request(playingPage.data.pic, "GET", null, null, "blob")
              .then((e) => {
                e = e.response;
                const blob = new Blob([e], { type: "image/jpeg" });
                if (
                  playingPage.downloaded.indexOf(playingPage.data.songid) > -1
                ) {
                  cache.put(filename, new Response(blob));
                }
                if (currentId != playingPage.data.songid) return;
                const url = URL.createObjectURL(blob);
                $("#songCover").src = url;
                $(
                  "#content"
                ).style = `--background: url(${url}); height: calc(100% - 3rem);`;
                return;
              })
              .catch(() => {
                if (currentId != playingPage.data.songid) return;
                $("#songCover").src = "";
                $(
                  "#content"
                ).style = `--background: black; height: calc(100% - 3rem);`;
              });
            return null;
          }
        })
        .then((b) => {
          if (b && currentId == playingPage.data.songid) {
            const url = URL.createObjectURL(b);
            $("#songCover").src = url;
            $(
              "#content"
            ).style = `--background: url(${url}); height: calc(100% - 3rem);`;
          }
        });
    });
    function update(e) {
      $("#songProgressPlayed").innerHTML = secondtoread(music.currentTime);
      $(".softkeys").style=`--progress: ${music.currentTime/music.duration*100}%;`
      let ht = "";
      const t = music.currentTime;
      for (let i = playingPage.lyricData.length - 1; i >= 0; i--) {
        const d = playingPage.lyricData[i];
        if (t > d.time) {
          for (let j = i - 2; j <= i + 2; j++) {
            try {
              ht += `
                            <div class='lyricline ${i == j ? "lyricnow" : ""}'>
                                ${playingPage.lyricData[j].lrc}
                                ${
                                  playingPage.lyricMode !== "none" &&
                                  playingPage.lyricData[j][
                                    playingPage.lyricMode
                                  ]
                                    ? "<br>" +
                                      playingPage.lyricData[j][
                                        playingPage.lyricMode
                                      ]
                                    : ""
                                }
                            </div>
                            `;
            } catch (e) {
              ht += `
                            <div class='lyricline'>
                            </div>
                            `;
            }
          }
          break;
        }
      }
      $("#songLyrics").innerHTML = ht;
    }
    if (playingPage.tick) clearInterval(playingPage.tick);
    playingPage.tick = setInterval(update, 200);
  },
  onLoad(recover) {
    $("#content").classList.add("playing");
    $(".softkeys").classList.add("playing");
    updateSoftKey({
      right: {
        label: "Back",
        callback: function () {
          if (playingPage.panelOpen) {
            playingPage.panelOpen = false;
          } else {
            pageMgr.goBack();
            clearInterval(playingPage.tick);
            $("#content").classList.remove("playing");
            $(".softkeys").classList.remove("playing");
            playingPage.tick = null;
          }
        },
      },
    });
    if (!recover || !this.data || !this.inited) {
      this.inited = true;
      this.playSong();
    } else {
      this.updateInfo();
    }
  },
  get playHistory() {
    if (localStorage.playHistory) {
      let hist = JSON.parse(localStorage.playHistory);
      return hist;
    } else {
      return [];
    }
  },
  set playHistory(e) {
    localStorage.playHistory = JSON.stringify(e);
  },
  get knownSongs() {
    if (localStorage.knownSongs) {
      let hist = JSON.parse(localStorage.knownSongs);
      return hist;
    } else {
      return {};
    }
  },
  set knownSongs(e) {
    localStorage.knownSongs = JSON.stringify(e);
  },
  playSong() {
    const known = () => {
      let hist = this.playHistory;
      const q = hist.findIndex((e) => {
        return e === this.data.songid;
      });
      if (q > -1) {
        hist.splice(q, 1);
      }
      hist.unshift(this.data.songid);
      hist = hist.slice(0, 100);
      this.playHistory = hist;

      const knownSongs = this.knownSongs;
      knownSongs[this.data.songid] = this.data;
      this.knownSongs = knownSongs;

      $("#songProgressPlayed").innerHTML = "00:00";
      $("#songProgressTotal").innerHTML = "Loading...";
      $(".softkeys").style=`--progress: 0;`
      $("#songName").innerHTML = playingPage.data.title;
      $("#songArtist").innerHTML = playingPage.data.author;

      this.lyricData = [];
      let lrcOri = this.data.lrc;
      lrcOri = lrcOri.split("\n");
      for (let i = 0; i < lrcOri.length; i++) {
        const row = lrcOri[i];
        const d = row.match(/\[(\d+):(\d+)\.(\d+)\](.+)/);
        if (d && d[1]) {
          let t =
            parseInt(d[1]) * 60 +
            parseInt(d[2]) +
            parseInt(d[3]) / Math.pow(10, parseInt(d[3].length));
          if (t == 99 * 60) t = 0;
          if (d[4] && d[4].trim())
            this.lyricData.push({ time: t, lrc: d[4].trim() });
        }
      }
      if (!this.lyricData.length)
        this.lyricData.push({ time: 0, lrc: "No lyrics" });
      else {
        if (this.lyricData[0].time !== 0) {
          this.lyricData.unshift({
            time: 0,
            lrc: `${playingPage.data.title} - ${playingPage.data.author}`,
          });
        }
        if (this.data.tlyric) {
          lrcOri = this.data.tlyric;
          lrcOri = lrcOri.split("\n");
          for (let i = 0; i < lrcOri.length; i++) {
            const row = lrcOri[i];
            const d = row.match(/\[(\d+):(\d+)\.(\d+)\](.+)/);
            if (d && d[1]) {
              const t =
                parseInt(d[1]) * 60 +
                parseInt(d[2]) +
                parseInt(d[3]) / Math.pow(10, parseInt(d[3].length));
              if (d[4] && d[4].trim()) {
                const idx = this.lyricData.findIndex((e) => e.time == t);
                if (idx > -1) this.lyricData[idx].translate = d[4].trim();
              }
            }
          }
        }
        if (this.data.romalrc) {
          lrcOri = this.data.romalrc;
          lrcOri = lrcOri.split("\n");
          for (let i = 0; i < lrcOri.length; i++) {
            const row = lrcOri[i];
            const d = row.match(/\[(\d+):(\d+)\.(\d+)\](.+)/);
            if (d && d[1]) {
              const t =
                parseInt(d[1]) * 60 +
                parseInt(d[2]) +
                parseInt(d[3]) / Math.pow(10, parseInt(d[3].length));
              if (d[4] && d[4].trim()) {
                const idx = this.lyricData.findIndex((e) => e.time == t);
                if (idx > -1) this.lyricData[idx].romaji = d[4].trim();
              }
            }
          }
        }
      }

      const nowid = this.data.songid;

      this.getPlayURL()
        .then((url) => {
          if (nowid !== this.data.songid) return;
          if (!music) {
            music = new Audio(url);
            music.mozAudioChannelType = "content";
            music.onended = (e) => {
              if (playingPage.data.type === "netease")
                ncmApi.record(playingPage.data.songid, null, music.duration);
              this.nextSong();
            };
            music.play();
          } else {
            music.src = url;
            music.fastSeek(0);
            music.play();
          }
          this.toPrevSong = false;
          this.updateInfo();
          music.oncanplay = this.updateInfo;
        })
        .catch((e) => {
          playingPage.nextSong(null, true, true);
        });
    };

    if (this.data.songid) known();
    else {
      musicListPage
        .getFullData(this.data.id, "netease", this.data)
        .then((ex) => {
          this.data = ex;
          known();
        })
        .catch(() => {
          playingPage.nextSong(null, true, true);
        });
    }
  },
  switchLyrics() {
    const det = document.querySelector("#songDetail");
    const lrc = document.querySelector("#songLyrics");
    if (det.style.display == "none") {
      showToast("Cover Mode");
      det.style.display = "block";
      lrc.style.display = "none";
      playingPage.updateInfo();
    } else {
      showToast("Lyric Mode");
      det.style.display = "none";
      lrc.style.display = "block";
      playingPage.updateInfo();
    }
  },
};

document.addEventListener("DOMContentLoaded", function () {
  pageMgr.load(pageIndex);
});
